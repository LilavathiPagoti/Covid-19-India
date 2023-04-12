const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDbObjectToResponseObjectDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const stateArray = await database.all(getStatesQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//get stateId API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    
    SELECT * FROM state 
    WHERE state_id=${stateId};
    
    `;
  const state = await database.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  // const{district_Id}=request.params;
  const postDistrictQuery = `
    INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    
    
    `;
  const district = await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrict = `
    UPDATE district SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};
    
    `;
  await database.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    
    SELECT * FROM district 
    WHERE district_id=${districtId};
    
    `;
  const district = await database.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObjectDistrict(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("district Removed");
});
//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesStatsQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district 
    WHERE state_id=${stateId};
    
    `;
  const stats = await database.get(getStatesStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
//API 8

// app.get("/districts/:districtId/details/", async (request, response) => {
//   const { districtId } = request.params;
//   const getDistrictIdQuery = `

//      SELECT state_id FROM district
//      WHERE district_id=${districtId};

//      `;
//   const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
//   const getStateNameQuery = `
// SELECT state_name as stateName FROM state
// WHERE state_id = ${getDistrictIdQueryResponse.state_id}`;
//   const getStateNameQueryResponse = await database.get(getStateNameQuery);
//   response.send(getStateNameQueryResponse);
// });
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
SELECT state_id FROM district
WHERE district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);

  const getStateNameQuery = `
SELECT state_name as stateName FROM state
WHERE state_id = ${getDistrictIdQueryResponse.state_id};
`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
