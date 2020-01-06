const mongoose = require("mongoose");

function handleMongoError(err, req, res, next) {
  let message = null;
  if (err.name === "MongoError") {
    switch (err.code) {
      case 11000:
        message = `The following prop/value must be unique: ${JSON.stringify(err.keyValue)}`;
        break;

      default:
        console.log("MongoError: " + JSON.stringify(err, null, 2));
        message = "There was an error in the data for this request.";
        break;
    }
  }

  if (err instanceof mongoose.Error) {
    switch (err.name) {
      case "CastError":
        message = `Value "${err.stringValue}" must be a valid "${err.kind}".`;
        break;

      default:
        console.log("MongooseError: " + JSON.stringify(err, null, 2));
        message = "There was an error in the data for this request.";
    }
  }

  if (message) {
    res.locals.errors.push(message);
    return next();
  }

  next(err);
}

module.exports = {
  handleMongoError
};