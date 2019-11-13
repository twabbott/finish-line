const config = require("../config");
const mongoose = require("mongoose");

const connectionOptions = { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
};

// NOTE: Mongoose connections are asynchronous, and you do not have to be
// connected before continuing.
mongoose.connect(config.dbConnectionUrl, connectionOptions)
  .then(() => console.log(`MongoDB connected at ${config.dbConnectionUrl}`))
  .catch(e => console.error("Connection error: ", e.message));

module.exports = mongoose.connection;
