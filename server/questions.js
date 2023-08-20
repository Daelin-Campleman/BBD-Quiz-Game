/**
 * See https://the-trivia-api.com/docs/v2/#tag/Questions/operation/getRandomQuestions for explanation of each param.
 * 
 */
import fetch from "node-fetch";
import { config } from "dotenv";
import fs from 'fs'


/**
 * 
 * @param {object} gameOptions 
 * @returns {JSON}
 * 
 * *
 * Fetches questions from external API
 * 
 */
function getQuestions(gameOptions) {
    console.log("Getting questions");
    const defaultOptions = {
        questionsPerRound: 5,
        numberOfRounds: 1,
        categories: "technology",
        difficulties: "easy"
    }

    let finalGameOptions = {...defaultOptions, ...gameOptions};
    let rawdata = fs.readFileSync('./questions.json');
    let data = JSON.parse(rawdata);
    console.log(data.length);
    let mappedData = getRandomQuestions(data, finalGameOptions.questionsPerRound * finalGameOptions.numberOfRounds);

    return mappedData;
}

function getRandomQuestions(questions, numQuestions) {
    var arr = [];
    while(arr.length < numQuestions){
        var r = Math.floor(Math.random() * (questions.length-1)) + 1;
        if(arr.indexOf(r) === -1) arr.push(r);
    }
    let randomQ = [];
    arr.forEach(i => {
        randomQ.push(questions[i]);
    });
    return randomQ;
}

export { getQuestions};