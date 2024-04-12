const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
let db = null

const inilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
  }
}
inilizeDBAndServer()

const convertPlayerDetailsDB = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDetailsDB = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

const covertPlayerMatchDetailDB = dbObject => {
  return {
    playerMatchid: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  }
}
//get player api
app.get('/players/', async (request, response) => {
  const getPlayerQuery = `
   SELECT * FROM player_details;`
  const playerArray = await db.all(getPlayerQuery)
  response.send(
    playerArray.map(eachPlayer => convertPlayerDetailsDB(eachPlayer)),
  )
  console.log(playerArray)
})
// get playerId api
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayeridQuery = `
  SELECT * FROM player_details
  WHERE player_id=${playerId};`
  const player = await db.get(getPlayeridQuery)
  response.send(convertPlayerDetailsDB(player))
})

// put players API
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const putPlayerQuery = `
   UPDATE player_details
   SET 
   player_name="${playerName}"
   WHERE player_id=${playerId};`
  const player = await db.run(putPlayerQuery)
  response.send('Player Details Updated')
})

//get match api
app.get('/matches/', async (request, response) => {
  const getMatchQuery = `
  SELECT * FROM match_details;
  `
  const match = await db.all(getMatchQuery)
  response.send(match.map(eachmatch => convertMatchDetailsDB(eachmatch)))
})

//get matchId api
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchIdQuery = `
  SELECT * FROM match_details
  WHERE match_id=${matchId};`
  const match = await db.get(getMatchIdQuery)
  response.send(convertMatchDetailsDB(match))
})

//get player Match api

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const {matchId, match, year} = request.body
  const getPlayerMatchQuery = `
  SELECT * FROM
  player_match_score NATURAL JOIN match_details
  WHERE player_id=${playerId};
  `
  const palyermatch = await db.all(getPlayerMatchQuery)
  response.send(palyermatch.map(eachMatch => convertMatchDetailsDB(eachMatch)))
})

// get match Player apl
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getmatchPlayerQuery = `
  SELECT * FROM 
  player_match_score NATURAL JOIN player_details
  WHERE match_id=${matchId};`
  const matchPlayer = await db.all(getmatchPlayerQuery)
  response.send(
    matchPlayer.map(eachPlayer => convertPlayerDetailsDB(eachPlayer)),
  )
})

// get total player API
app.get('/players/:playerId/playerScores', (request, response) => {
  const {playerId} = request.params
  const getTotalQuer = `
  SELECT
  player_details.player_id AS playerId,
  player-details.player_name AS playerName,
  SUM(player_match_score.score) AS TotalScore,
  SUM(fours) AS TotalFours,
  SUM(sixes) AS TotalSixes
  FROM 
  player_details INNER JOIN player_match_score ON
  player_details.player_id=player_match_score.player_id
  WHERE player_details.player_id=${playerId};
  `
  const playermatch = db.get(getTotalQuer)
  response.send(
    playermatch.map(eachMatch => covertPlayerMatchDetailDB(eachmatch)),
  )
})
module.exports = app
