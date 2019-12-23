const express = require("express");
const config = require("./config");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./db");
const router = require("./routes");
const responses = require("./controllers/responses");

const app = express(express.json());

app.set("port", config.port);

app.use(bodyParser.json());
app.use ((error, req, res, next) => { // eslint-disable-line
  console.log(JSON.stringify(error));
  responses.badRequest(res, error.message);
});

app.use(cors());

app.use(express.static("static"));

app.use(morgan("dev"));

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", router);

app.use(function(req, res) {
  responses.notFound(res, "Not found");
});

app.listen(config.port, () => { 
  console.log(`Server running on port ${config.port}`);
  console.log(`View server status at: http://localhost:${config.port}`);
});
