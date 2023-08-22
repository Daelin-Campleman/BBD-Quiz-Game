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
            "name" : user.fields.first_name + " " + user.fields.last_name,
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
      // https://stackoverflow.com/a/9204568
      let email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let phone_regex = /^\d{10}|^\+\d{11}/;
      if (!email_regex.test(req.body.email)) {
        res.status(400).json({
          result: "email",
        });
      } else if (!phone_regex.test(req.body.phone)) {
        res.status(400).json({
          result: "phone",
        });
      } else if (
        req.body.firstName.length <= 1 ||
        req.body.surname.length <= 1
      ) {
        res.status(400).json({
          result: "name",
        });
      } else if (req.body.degree.length <= 1 || req.body.year.length <= 1) {
        res.status(400).json({
          result: "degree",
        });
      } else {
        let response = await insertUserRequest(req.body);
        response = await response.json();

        const userId = response.fields.user_id;

        res.status(200).json({
          result: "success",
          id: userId,
        });
      }
    } catch(e){
        res.status(400).json({
            "result" : e
        });
    }
});

gameRouter.post("/auth", async (req, res) => {
    const checkPass = process.env.ADMIN_PASSWORD || "Lucky@BBD";
    if(req.body.password === checkPass){
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