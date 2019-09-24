const mongoose = require("mongoose");

const connectionUrl = "mongodb://127.0.0.1:27017/finish-line";
const connectionOptions = { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
};

// NOTE: Mongoose connections are asynchronous, and you do not have to be
// connected before continuing.
mongoose.connect(connectionUrl, connectionOptions)
  .then(() => console.log(`MongoDB connected at ${connectionUrl}`))
  .catch(e => console.error("Connection error: ", e.message));

module.exports = mongoose.connection;
