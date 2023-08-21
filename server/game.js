import { getQuestions } from "./questions.js";
import { createGameRequest, saveGameLeaderBoardRequest, savePlayerContactDetailsRequest } from "../db/requests.js";

function PlayerContactDetails(name, surname, degree, university, year, poppi, email, phone) {
  this.name = name;
  this.surname = surname;
  this.degree = degree;
  this.university = university;
  this.year = year;
  this.poppi = poppi;
  this.email = email;
  this.phone = phone;
}

function Player(ws, name, id, isHost, isOriginalHost = false) {
  this.ws = ws;
  this.name = name;
  this.id = id;
  this.score = 0;
  this.calculatedScore = 0;
  this.currentAnswer = "";
  this.answerHistory = [];
  this.currentMultiplier = 0;
  this.multiplierHistory = [];
  this.isHost = isHost;
  this.isOriginalHost = isOriginalHost;
}

const liveGames = new Map();

let hotPotatoed = false;

let playerContactDetailsStore = [];

/**
 * 
 * @param {Websocket} startingPlayer 
 * @param {Object} gameOptions
 * 
 * *
 * Creates a new game and stores it in liveGames. 
 */
export async function createGame(startingPlayer, gameOptions) {
  const getRandomCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();

  const joinCode = getRandomCode();
  let result = await createGameRequest(joinCode);
  result = await result.json();

  let gameId = result.fields.game_id;

  let user = gameOptions['player'];
  let questions = getQuestions(gameOptions);
  let game = {
    gameId: gameId,
    joinCode: joinCode,
    players: [new Player(startingPlayer, user['name'], user['id'], true, true)],
    questionsPerRound: gameOptions.questionsPerRound || 5,
    numberOfRounds: gameOptions.numberOfRounds || 3,
    currentRound: 1,
    currentQuestion: 1,
    started: false,
    questions: questions,
    intervalID: 0,
    roundTime: gameOptions.roundLength || 5000,
  };
  liveGames.set(joinCode, game);
  startingPlayer.send(JSON.stringify({
    requestType: "JOIN",
    isHost: true,
    joinCode: joinCode,
    message: `joined game with player id: ${user['id']}`
  }));

  startingPlayer.on("close", hotPotato(joinCode));
}

function hotPotato(joinCode) {
  return function() {
    hotPotatoed = true;

    if (liveGames.get(joinCode) == undefined)
      return;

    if (liveGames.get(joinCode).players.length == 1 || liveGames.get(joinCode).started == false) {
      endGame(joinCode);
    }
    else {
      liveGames.get(joinCode).players.shift();
      liveGames.get(joinCode).players[0].isHost = true;
      liveGames.get(joinCode).players[0].ws.on("close", hotPotato(joinCode));
    }
  }
}

/**
 * 
 * @param {Websocket} client 
 * @param {Object} options 
 * Receives answer for player and stores in player object in game object in liveGames
 */
export function clientAnswer(client, options) {
  const game = liveGames.get(options['joinCode']);
  const answer = options['answer'];
  const user = options['player'];
  const multiplier = options['multiplier'];
  const player = game.players.find(p => p.id === user['id'])
  if (player != undefined) {
    player.currentAnswer = answer;
    player.currentMultiplier = multiplier;
  }
  client.send(JSON.stringify({
    message: "Answer received"
  })); 
}

/**
 * 
 * @param {Websocket} socket 
 * @param {Object} gameOptions 
 * Adds new player to game
 */
export function joinGame(socket, gameOptions) {

  const verifyUserDetails = (user) => {
    return user['name'] !== '' && user['surname'] !== '' && user['degree'] !== '' && user['university'] !== '' && user['year'] !== '' && user['poppi'] !== '' && user['email'] !== '' && user['phone'] !== '' || 1==1;
  }

  let joinCode = gameOptions['joinCode'];
  let user = gameOptions['player'];

  const game = liveGames.get(joinCode);

  if (game === undefined) {
    socket.send(JSON.stringify({
      requestType: "JOIN",
      success: false,
      message: "Game does not exist."
    }))
  } else if (game.started) {
    socket.send(JSON.stringify({
      requestType: "JOIN",
      requestType: "Game has already started.",
      success: false
    }));
  } else {
    const player = game.players.find(p => p.id === user['id']);
    if (player !== undefined && process.env.NODE_ENV != 'development') {
      socket.send(JSON.stringify({
        requestType: "JOIN",
        message: "Player already in game",
        success: false
      }));
    } else {
      if (!verifyUserDetails(user)) {
        socket.send(JSON.stringify({
          requestType: "JOIN",
          success: false, 
          message: `Missing some user details`, 
        }));
      }
      else {
        playerContactDetailsStore = [...playerContactDetailsStore, new PlayerContactDetails(user['name'], user['surname'], user['degree'], user['university'], user['year'], user['poppi'], user['email'], user['phone'])];
        game.players.push(new Player(socket, user['name'], user['id'], false));
        game.players[0].ws.send(JSON.stringify({
          requestType: "JOIN",
          ...game, 
          success: true,
          isHost: true,
          newPlayer: true
        }));
        socket.send(JSON.stringify({
          requestType: "JOIN",
          success: true, 
          message: `Successfully Joined Game with player id: ${user['id']}`, 
        }));
      }
      
    }
  }
}

/**
 * 
 * @param {Object} question 
 * @param {String} joinCode 
 * @param {Number} questionNumber 
 * @param {Number} roundNumber 
 * @param {Number} roundTime 
 * Sends a question to all clients in game
 */
function sendQuestions(question, joinCode, questionNumber, roundNumber, roundTime) {
  const game = liveGames.get(joinCode);
  if (game != undefined) {
    const players = game.players;
    players.forEach(p => {
      p.ws.send(JSON.stringify({
        requestType: "QUESTION",
        questionText: question.question,
        questionOptions: shuffleArray([...question.incorrectAnswers, question.correctAnswer]),
        questionNumber: questionNumber,
        roundNumber: roundNumber,
        roundTime: roundTime,
        gameId: game.gameId,
        joinCode: game.joinCode
      }));
    })
  }
}

/**
 * 
 * @param {array} array 
 * @returns shuffled array
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 
 * @param {String} joinCode
 * 
 * *
 * Starts gameloop
 */
export function startGame(joinCode) {
  const game = liveGames.get(joinCode);
  game.started = true;
  sendQuestions(game.questions[calculateQuestionNumber(joinCode)], joinCode, game.currentQuestion, game.currentRound, game.roundTime);
  game.intervalID = setInterval(() => {
    questionOver(joinCode);
  }, game.roundTime);
}

/**
 * 
 * @param {string} joinCode
 * 
 * *
 * Triggers every question interval and sends question to players in a game 
 */
export function questionOver(joinCode) {
  const game = liveGames.get(joinCode);
  const players = game.players;
  let correctAnswer = game.questions[calculateQuestionNumber(joinCode)].correctAnswer.trim().toUpperCase();
  game.currentQuestion++;
  players.forEach(p => {
    if (p.currentAnswer.trim().toUpperCase() === correctAnswer) {
      p.score++;
      p.calculatedScore += p.currentMultiplier;
      p.answerHistory.push(true);
    } else {
      p.answerHistory.push(false);
    }
    p.multiplierHistory.push(p.currentMultiplier);
    p.currentMultiplier = 0;
  });
  
  if (game.currentQuestion > game.questionsPerRound) {
    roundOver(joinCode);
  } else {
    sendQuestions(game.questions[calculateQuestionNumber(joinCode)], joinCode, game.currentQuestion, game.currentRound, game.roundTime);
  }
}

/**
 * 
 * @param {string} joinCode
 * 
 * *
 * Ends round, queues next round start 
 */
export function roundOver(joinCode) {
  const game = liveGames.get(joinCode);
  game.started = false;
  clearInterval(game.intervalID);
  game.currentQuestion = 1;
  game.currentRound += 1;
  if (game.currentRound > game.numberOfRounds) {
    endGame(joinCode);
  } else {
    const players = game.players;
    players.forEach(p => {
      p.ws.send(JSON.stringify({
        requestType: "ROUND OVER",
        isHost: p.isHost,
        joinCode: joinCode,
        gameId: game.gameId
      }));
    })
  }
}

/**
 *
 * @param {Number} joinCode 
 *  Starts the next round for the associated game
 */
export function nextRound(joinCode) {
  const game = liveGames.get(joinCode);
    sendQuestions(game.questions[calculateQuestionNumber(joinCode)], joinCode, game.currentQuestion, game.currentRound, game.roundTime);
    game.intervalID = setInterval(() => {
      questionOver(joinCode);
    }, game.roundTime);
}


/**
 * 
 * @param {string} joinCode
 * 
 * *
 * Ends the game and returns scores
 */
function endGame(joinCode) {
  const game = liveGames.get(joinCode);
  clearInterval(game.intervalID);
  const players = game.players;
  const playerDetails = players.map((p) => {
    return {
      name: p.name,
      score: p.score,
      calculatedScore: p.calculatedScore
    }
  });
  
  players.forEach(p => {
    p.ws.send(JSON.stringify({
      requestType: "GAME OVER",
      score: p.score,
      playerDetails: playerDetails,
      gameId: game.gameId
    }))
  });
  sendToDB(joinCode, game.gameId);
  liveGames.delete(joinCode);
}

function calculateQuestionNumber(joinCode, gameId) {
  const game = liveGames.get(joinCode);
  return (game.currentRound - 1) * game.questionsPerRound + game.currentQuestion - 1;
}

/**
 * 
 * @param {string} joinCode 
 * @param {string} gameId
 * 
 * *
 * Saves game in DB for leaderboard access 
 */
async function sendToDB(joinCode, gameId) {
  const game = liveGames.get(joinCode);

  let players = game.players;

  players = players.filter(p => !p.isHost);
  let result = await saveGameLeaderBoardRequest(gameId, players);
  result = await result.json();
  //await savePlayerContactDetailsRequest(playerContactDetailsStore);
}

function isEmpty(answer){
  return asnwer == "";
}