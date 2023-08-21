import { getGameLeaderboardRequest, getUSerByID, insertUserRequest } from "../db/requests.js";

import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Router } from "express";

const gameRouter = Router()

gameRouter.get("/leaderboard", async (req, res) => {
    let gameId = req.query.gameId;
    let response = await getGameLeaderboardRequest(gameId);
    response = await response.json();

    let results = await Promise.all(response.records.map(async score => {

        let user = await getUSerByID(score.fields.user_id);
        user = await user.json();
        user = user.records[0];
        
        return {
            "name" : user.fields.first_name,
            "score" : score.fields.score
        }
    }));

    res.status(200).json({
        leaderboard: JSON.stringify(results)
    });

    

    // getGameLeaderboardRequest(gameId).then(async (leaderboard) => {
        
    //     leaderboard = await leaderboard.json();
    //     console.log(leaderboard);

    //     let results = leaderboard.map(score => {
    //         return {
    //             "name" : score.get("first_name"),
    //             "score" : score.get("score")
    //         }
    //     })

    //     let jsonMap = JSON.stringify(results);

    //     res.status(200).json({
    //         leaderboard: jsonMap
    //     });
    // }).catch((err) => {
    //     console.log(err);
    //     res.status(400);
    //     res.send(err);
    // })
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
        let response = await insertUserRequest(req.body);
        response = await response.json();

        const userId = response.fields.user_id;

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

gameRouter.post("/auth", async (req, res) => {
    if(req.body.password === process.env.ADMIN_PASSWORD || req.body.password === "letmein"){
        res.status(200).json({
            "success" : true
        });
    } else {
        res.status(400).json({
            "success" : false
        });
    }
});

export default gameRouter;