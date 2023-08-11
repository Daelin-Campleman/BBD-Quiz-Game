import express from "express";
import logger from "morgan";
import { config } from "dotenv";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectSqlite from "connect-sqlite3";
import csrf from "csurf";
import path from "path";
import { fileURLToPath } from 'url';

import gameRouter from "./routes/game.route.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();
const app = express();

const SQLiteStore = connectSqlite(session);

if (["development", "production"].includes(process.env.NODE_ENV)) {
  app.use(logger("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(errorHandler);
app.use(session({
  secret: 'the ultimate secret',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));
app.use(csrf());

app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/game', gameRouter)
app.use('/home',express.static(__dirname + '/public'));
app.use('/',express.static(__dirname + '/protected'))

export default app;