import express from "express";
import logger from "morgan";
import { config } from "dotenv";
import errorHandler from "./middleware/errorHandler.js";
import path from "path";
import { fileURLToPath } from 'url';

import gameRouter from "./routes/game.route.js"
import Airtable from "airtable";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();
const app = express();

if (["development", "production"].includes(process.env.NODE_ENV)) {
  app.use(logger("dev"));
}
app.use(logger("dev"));

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(errorHandler);

app.use('/game', gameRouter)
app.use('/',express.static(__dirname + '/public'));
app.use('/home',express.static(__dirname + '/protected'))
app.use('/admin',express.static(__dirname + '/admin'))

export default app;