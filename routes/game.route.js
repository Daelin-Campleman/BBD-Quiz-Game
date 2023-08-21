import { getGameLeaderboardRequest, insertUserRequest } from "../db/requests.js";

import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Router } from "express";

const gameRouter = Router()

gameRouter.get("/leaderboard", async (req, res) => {
    let gameId = req.query.gameId;
    getGameLeaderboardRequest(gameId).then((leaderboard) => {
        let results = leaderboard.map(score => {
            return {
                "name" : score.get("first_name"),
                "score" : score.get("score")
            }
        })

        let jsonMap = JSON.stringify(results);

        res.status(200).json({
            leaderboard: jsonMap
        });
    }).catch((err) => {
        console.log(err);
        res.status(400);
        res.send(err);
    })
});
  
gameRouter.get("/leaderboard/all", async (req, res) => {
    getTableRequest().then((table) => {
        res.send(JSON.stringify({
            table: table
        }))
    }).catch((err) => {
        res.status(400);
        res.send(err);
    })
});

gameRouter.post("/user/register", async (req, res) => {
    try{
        const response = await insertUserRequest(req.body);
        const userId = response[0].get("user_id");

        res.status(200).json({
            result : "success",
            id : userId
        });
    } catch(e){


        res.status(400).json({
            "result" : e
        });
    }
});

export default gameRouter;