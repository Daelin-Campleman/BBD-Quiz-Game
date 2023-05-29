/**
 * See https://the-trivia-api.com/docs/v2/#tag/Questions/operation/getRandomQuestions for explanation of each param.
 * 
 */
import fetch from "node-fetch";
import { config } from "dotenv";

/**
 * 
 * @param {object} gameOptions 
 * @returns {JSON}
 * 
 * *
 * Fetches questions from external API
 * 
 */
async function getQuestions(gameOptions) {
    console.log("Getting questions");
    let removedQuestions = 0;
    const URL = "https://quizapi.io/api/v1/questions"
    const defaultOptions = {
        questionsPerRound: 5,
        numberOfRounds: 1,
        categories: "technology",
        difficulties: "medium"
    }
    let finalGameOptions = {...defaultOptions, ...gameOptions};
    let full_url = URL + `?apiKey=${process.env.API_KEY}&limit=${finalGameOptions.questionsPerRound * finalGameOptions.numberOfRounds}&difficulty=${finalGameOptions.difficulties}`;
    let res = await fetch(full_url);
    let data = await res.json();
    let filteredData = data.filter(question => {
        if(question.multiple_correct_answers == "true"){
            removedQuestions++;
            return false;
        } else {
            return true;
        }
    });
    let mappedData = filteredData.map(question => {
        return {
            question: question.question,
            incorrectAnswers: getIncorrectAnswers(question.answers, question.correct_answers),
            correctAnswer: getCorrectAnswer(question.answers, question.correct_answers)
        }
    });

    if(removedQuestions != 0){
        let tmpGameOptions = gameOptions;
        tmpGameOptions.questionsPerRound = removedQuestions;
        tmpGameOptions.numberOfRounds = 1;
        console.log("Getting " + removedQuestions + " more questions.");
        mappedData += getQuestions(tmpGameOptions);
    }

    return mappedData;
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