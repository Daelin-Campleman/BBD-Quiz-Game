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
    data = data.filter(q => q.difficulty.toUpperCase() === finalGameOptions.difficulties.toUpperCase());
    data = getRandomQuestions(data, finalGameOptions.questionsPerRound * finalGameOptions.numberOfRounds);

    let mappedData = data.map(question => {
        return {
            question: question.question,
            incorrectAnswers: getIncorrectAnswers(question.answers, question.correct_answers),
            correctAnswer: getCorrectAnswer(question.answers, question.correct_answers)
        }
    });

    return mappedData;
}

function getRandomQuestions(questions, numQuestions) {
    var arr = [];
    while(arr.length < numQuestions){
        var r = Math.floor(Math.random() * 100) + 1;
        if(arr.indexOf(r) === -1) arr.push(r);
    }
    let randomQ = [];
    arr.forEach(i => {
        randomQ.push(questions[i]);
    });
    return randomQ;
}

function getIncorrectAnswers(answers, correctArr){
    let output = [];
    if(correctArr.answer_a_correct == "false"){
        output.push(answers.answer_a)
    }
    if(correctArr.answer_b_correct == "false"){
        output.push(answers.answer_b)
    }
    if(answers.answer_c != null && correctArr.answer_c_correct == "false"){
        output.push(answers.answer_c)
    }
    if(answers.answer_d != null && correctArr.answer_d_correct == "false"){
        output.push(answers.answer_d)
    }
    if(answers.answer_e != null && correctArr.answer_e_correct == "false"){
        output.push(answers.answer_e)
    }
    if(answers.answer_f != null && correctArr.answer_f_correct == "false"){
        output.push(answers.answer_f)
    }

    if(output.length <= 3){
        return output;
    } else {
        return output.slice(0, 3);
    }
    
}

function getCorrectAnswer(answers, correctArr){
    if(correctArr.answer_a_correct == "true"){
        return answers.answer_a;
    } else
    if(correctArr.answer_b_correct == "true"){
        return answers.answer_b;
    } else
    if(answers.answer_c != null && correctArr.answer_c_correct == "true"){
        return answers.answer_c;
    } else
    if(answers.answer_d != null && correctArr.answer_d_correct == "true"){
        return answers.answer_d;
    } else
    if(answers.answer_e != null && correctArr.answer_e_correct == "true"){
        return answers.answer_e;
    } else
    if(answers.answer_f != null && correctArr.answer_f_correct == "true"){
        return answers.answer_f;
    }

    return "";
}

export { getQuestions};