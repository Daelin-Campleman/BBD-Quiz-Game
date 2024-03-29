import { getGameLeaderboardRequest, getUSerByID, insertUserRequest } from "../db/requests.js";

import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Router } from "express";

const gameRouter = Router()

gameRouter.get("/leaderboard", async (req, res) => {
    try {
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
    } catch (err) {
        console.log(err);
        res.status(400);
        res.send(err);
    }
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

gameRouter.get("/user/check", async (req, res) => {
  let u = await getUSerByID(req.query.user_id);
  u = await u.json();
  if (u.records && u.records.length > 0){
    res.status(200).json({
      result: "success"
    });
  }
  else {
    res.status(200).json({
      result: "failure"
    });
  }
});

gameRouter.post("/user/register", async (req, res) => {
    try {
      // https://stackoverflow.com/a/9204568
      let email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let phone_regex = /^\d{10}|^\+\d{11}/;
      let isWrong = false;
      let wrongFields = [];
      if (!email_regex.test(req.body.email)) {
        isWrong = true;
        wrongFields = [...wrongFields, "email"];
      }
      if (!phone_regex.test(req.body.phone)) {
        isWrong = true;
        wrongFields = [...wrongFields, "phone"];
      }
      if (req.body.firstName.length <= 1) {
        isWrong = true;
        wrongFields = [...wrongFields, "first-name"];
      }
      if (req.body.surname.length <= 1) {
        isWrong = true;
        wrongFields = [...wrongFields, "last-name"];
      }
      if (req.body.degree.length <= 1) {
        isWrong = true;
        wrongFields = [...wrongFields, "degree"];
      }
      if (req.body.year.length <= 1) {
        isWrong = true;
        wrongFields = [...wrongFields, "year"];
      }
      if (isWrong) {
        res.status(200).json({
          result: wrongFields,
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