import { runQuery } from "./airTableDB.js";

export function createGameRequest(joinCode) {
    const fields = {
        fields: {
            join_code: joinCode
        }
    }

    const query = {
        url: TablesNames.Game,
        method: "POST",
        data: fields
    }

    return runQuery(query);
}

export function getGameLeaderboardRequest(gameID) {
    const query = {
        url: TablesNames.Leaderboard + "?filterByFormula=game_id=" + gameID,
        method: "GET"
    }

    return runQuery(query);
}

export function saveGameLeaderBoardRequest(gameId, players) {
    const records = [];

    for (let i=0; i<players.length; i++) {
        records.push({
            fields: {
                game_id: gameId,
                user_id: parseInt(players[i].id),
                score: players[i].calculatedScore,
                // correct: players[i].score
            }
        });
    }

    const query = {
        url: TablesNames.Leaderboard,
        method: "POST",
        data: {records: records}
    }

    return runQuery(query);
}

export function savePlayerContactDetailsRequest(playerDetails) {
    return Promise.resolve()
}

export function insertUserRequest(userDetails){

    const fields = {
        fields: {
            first_name: userDetails.firstName,
            last_name: userDetails.surname,
            degree: userDetails.degree,
            year: userDetails.year,
            email: userDetails.email,
            phone: userDetails.phone
        }
    }

    const query = {
        url: TablesNames.User,
        method: "POST",
        data: fields
    }

    return runQuery(query);
}

export function getUSerByID(usrId) {
    const query = {
        url: TablesNames.User + "?filterByFormula=user_id=" + usrId,
        method: "GET"
    }

    return runQuery(query);
}

const TablesNames = {
    User: "tblO9gajjRqKapanb",
    Game: "tbllBvAWA63F6vTiu",
    Leaderboard: "tbl7mRjmejWccQ4Sv" 
}