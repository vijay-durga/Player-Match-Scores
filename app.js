const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;
const initilizationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db error : ${error.message}`);
    process.exit(1);
  }
};
initilizationDbAndServer();

const playerDetailsRequiredFormat = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

const matchInRequiredFormat = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};

//api-1
app.get("/players/", async (request, response) => {
  const playersDetailsQuery = `SELECT * FROM player_details;`;
  const listOfPlayerDetails = await db.all(playersDetailsQuery);
  response.send(
    listOfPlayerDetails.map((each) => playerDetailsRequiredFormat(each))
  );
});

//api-2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailsQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const playerDetails = await db.get(playerDetailsQuery);
  response.send(playerDetailsRequiredFormat(playerDetails));
});

//api-3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  const player = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//api-4
app.get(`/matches/:matchId/`, async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(matchInRequiredFormat(matchDetails));
});

//api-5
app.get(`/players/:playerId/matches`, async (request, response) => {
  const { playerId } = request.params;
  const { matchId } = request.params;
  const playerMatchQuery = ` select  * from (match_details natural join player_match_score) as t  natural join player_details  where player_id =  ${playerId}; `;
  const player = await db.all(playerMatchQuery);
  response.send(player.map((each) => matchInRequiredFormat(each)));
});

//api-6
app.get(`/matches/:matchId/players`, async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from (player_details natural join player_match_score) as t  natural join match_details where match_id = ${matchId}  `;
  const result = await db.all(query);
  response.send(result.map((each) => playerDetailsRequiredFormat(each)));
});

//api-7
app.get(`/players/:playerId/playerScores`, async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT player_id AS playerId
   , player_name AS playerName
   , SUM(score) AS totalScore , 
   SUM(fours) AS totalFours, 
   SUM(sixes) AS totalSixes
   FROM
   player_details NATURAL JOIN player_match_score 
  WHERE player_id = ${playerId};`;
  const result = await db.get(query);
  response.send(result);
});

module.exports = app;
