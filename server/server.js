import { WebSocketServer } from "ws"; 
import { createGame, joinGame, startGame, clientAnswer, nextRound } from "./game.js";
import http from "http";
import debug from "debug";
import { config } from "dotenv";
import app from "../app.js";

config();

const DEBUG = debug("dev");
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

process.on("uncaughtException", (error) => {
  console.log(`uncaught exception: ${error}`);
  console.log(error);
  //process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("Unhandled Rejection:", {
    name: err.name,
    message: err.message || err,
  });
  //process.exit(1);
});

server.listen(PORT, () => {
  DEBUG(
    `server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`
    );
  });
  
const wss = new WebSocketServer({ server: server });

/**
 * 
 * @param {String} msg 
 * @param {Websocket} ws 
 * 
 * *
 * See MessagingFormat.md for a breakdown of messaging types
 */
function parseMessage(msg, ws) {
  switch(msg['requestType']) {
    case "CREATE":
      createGame(ws, msg);
      break;
    case "JOIN":
      joinGame(ws, msg);
      break;
    case "ANSWER":
      clientAnswer(ws, msg);
      break;
    case "START":
      startGame(msg['joinCode']);
      break;
    case "NEXT ROUND":
      nextRound(msg['joinCode'])
    default:
      return;
  }

}

wss.on("connection", (ws) => {
  ws.on("message", (msg) => parseMessage(JSON.parse(msg), ws));
});