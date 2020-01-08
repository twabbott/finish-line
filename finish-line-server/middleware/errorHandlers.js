const mongoose = require("mongoose");
const { BadRequestError } = require("../middleware/restFactory");

/** Middleware to handle MongoDB / Mongoose errors and return a 400 error to the 
 *  client.  This function will detect any known exceptions, and re-throw them as 
 *  an BadRequestError, which restFactory will capture and return as a 400 error to the client.
 * 
 * @param {string} message - A genreal error title message describing the operation being performed (e.g.: "Error reading user"). 
 */
function handleMongoErrors(message = "Unable to process request") {
  return (err, req, res, next) => {
    let description = null;
    if (err.name === "MongoError") {
      switch (err.code) {
        case 11000:
          description = `The following prop/value must be unique: ${JSON.stringify(err.keyValue)}`;
          break;

        default:
          console.log("MongoError: " + JSON.stringify(err, null, 2));
          description = "There was an error in the data for this request.";
          break;
      }
    }

    if (err instanceof mongoose.Error) {
      switch (err.name) {
        case "CastError":
          description = `Value ${err.stringValue} must be a valid ${err.kind}.`;
          break;

        default:
          console.log("MongooseError: " + JSON.stringify(err, null, 2));
          description = "There was an error in the data for this request.";
      }
    }

    if (description) {
      throw new BadRequestError(message, description);
    }

    next(err);
  };
}

/** returns a middleware that looks for vet validation errors
 *  and throws an BadRequestError if res.locals.errors is a non-empty array
 * 
 * @param {string} message - A genreal message that validation failed for the object type. 
 * @return {middleware} a middleware function.
 */
function handleValidationErrors(message) {
  return (req, res, next) => {
    if (res.locals.errors) {
      throw new BadRequestError(message, res.locals.errors);
    }

    next();
  };
}

module.exports = {
  handleMongoErrors,
  handleValidationErrors
};