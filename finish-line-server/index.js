const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./db");
const movieRouter = require("./routes");

const app = express();

const apiPort = (process.env.PORT || 3000);
app.set("port", apiPort);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static("static"));

app.use(morgan("dev"));

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", movieRouter);

app.use(function(req, res) {
  const err = new Error("Not Found");
  err.status = 404;
  res.json(err);
});

app.listen(apiPort, () => { 
  console.log(`Server running on port ${apiPort}`);
  console.log(`View server status at: http://localhost:${apiPort}`);
});
