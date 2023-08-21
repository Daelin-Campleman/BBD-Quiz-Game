import { config } from "dotenv";
import fetch from "node-fetch";

config();

const runQuery = async (query) => await fetch(process.env.AIRTABLE_URL + query.url, {
    method: query.method,
    headers: {
        "Authorization": process.env.AIRTABLE_API_KEY,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(query.data)
});

export { runQuery }