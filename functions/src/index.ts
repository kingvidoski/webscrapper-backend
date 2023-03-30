import * as functions from "firebase-functions";
import axios from "axios";
import { adminDb } from "./firebaseAdmin";
require('dotenv').config();



// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
const api_key = process.env.BRIGHT_DATA_KEY;

const fetchResult: any = async (id: string) => {
    console.log('STEP 4 --------------------------------');
    console.log(api_key);

    const data: any = await axios({
        method: 'get',
        url: `https://api.brightdata.com/dca/dataset?id=${id}`,
        headers: {
            Authorization: `Bearer ${api_key}`,
        },

    }).then((res) => {
        return res.data;
    });

    console.log('STEP 4.5 --------------------------------');
    console.log(data);

    if (data.status === "building" || data.status === "collecting") {
        console.log("NOT COMPLETE YET, TRYING AGAIN..")
        return fetchResult(id);
    }

    return data;
}





export const onScraperComplete = functions.https.onRequest(async (request, response) => {

    console.log('STEP 1 --------------------------------');
    console.log('SCRAPE COMPLETE >>>> : ', request.body);

    const { success, id, finished } = request.body;

    console.log('STEP 2 --------------------------------');
    if (!success) {
        await adminDb.collection('searches').doc(id).set({
            status: "error",
            updatedAt: finished,
        }, {
            merge: true
        })
    }

    console.log('STEP 3 --------------------------------');
    const data = await fetchResult(id);

    console.log('STEP 5 --------------------------------');
    await adminDb.collection('searches').doc(id).set({
        status: "complete",
        updatedAt: finished,
        results: data,
    }, {
        merge: true
    });

    console.log("finished scrapping")


    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("finished scrapping!");
});

//  https://a1d9-20-254-125-245.eu.ngrok.io/nigeria-lga/us-central1/onScraperComplete