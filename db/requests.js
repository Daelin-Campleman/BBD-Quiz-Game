import { TYPES } from "tedious";
import execSQLRequest from "./quizdb.js";
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
                score: players[i].score
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

export function selectFederatedCredentialsByIdRequest(provider, subject) {

    const sql = `
        SELECT [user_id]
        FROM [dbo].[federated_credentials]
        WHERE [provider] = @provider and [subject] = @subject;
    `;

    const params = [
        {
            name: "provider",
            type: TYPES.VarChar,
            value: provider
        },
        {
            name: "subject",
            type: TYPES.VarChar,
            value: subject
        }
    ];

    return execSQLRequest(sql, params);
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

export function insertFederatedCredentialsRequest(userId, provider, subject){
    
    const sql = `
        INSERT INTO [dbo].[federated_credentials] (
            [user_id],
            [provider],
            [subject]
        )
        OUTPUT inserted.[federated_credentials_id]
        VALUES (
            @userId,
            @provider,
            @subject
        );
    `;

    const params = [
        {
            name: "userId",
            type: TYPES.BigInt,
            value: userId
        },
        {
            name: "provider",
            type: TYPES.VarChar,
            value: provider
        },
        {
            name: "subject",
            type: TYPES.VarChar,
            value: subject
        }
    ];

    return execSQLRequest(sql, params);
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