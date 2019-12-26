

const sampleSchema = {
  name: String,
  height: Number,
  isVeteran: Boolean,
  birthday: Date,
  address: {

  }
}

function validateSimpleBooleanProperty(obj, key, data, errors) {
  if (!obj.hasOwnProperty(key)) {
    return;
  }

  const val = obj[key];
  if (typeof val !== "boolean") {
    errors.push(`Property "${key}" must be either true or false.`);
    return;
  }

  data[key] = val;
}

function validateSimpleNumberProperty(obj, key, data, errors) {
  if (!obj.hasOwnProperty(key)) {
    return;
  }

  const val = obj[key];
  if (typeof val !== "number") {
    errors.push(`Property "${key}" must be a number.`);
    return;
  }

  data[key] = val;
}

function validateSimpleStringProperty(obj, key, data, errors) {
  if (!obj.hasOwnProperty(key)) {
    return;
  }

  const val = obj[key];
  if (typeof val !== "string") {
    errors.push(`Property "${key}" must be a string.`);
    return;
  }

  data[key] = val;
}

function validateSimpleDateProperty(obj, key, data, errors) {
  if (!obj.hasOwnProperty(key)) {
    return;
  }

  const val = obj[key];
  if (typeof val !== "string") {
    errors.push(`Property "${key}" must be a string containing a date.`);
    return;
  }

  const timestamp = Date.parse(val);
  if (isNaN(timestamp) == false) {
    data[key] = new Date(timestamp);
  } else {
    errors.push(`Property "${key}" does not contain a valid date string.`);
  }
}

function validateObjectProperties(obj, schema) {
  const data = {};
  const errors = [];

  for (let key in schema) {
    switch(schema[key]) {
      case Boolean:
        validateSimpleBooleanProperty(obj, key, data, errors);
        break;

      case Number:
        validateSimpleNumberProperty(obj, key, data, errors);
        break;

      case String:
        validateSimpleStringProperty(obj, key, data, errors);
        break;

      case Date:
          validateSimpleDateProperty(obj, key, data, errors);
          break;
  
      default:
        if (typeof schema[key] !== "object") {
          throw new Error(`Schema property ${key} has unsupported type.`);
        }
        break;
    }
  }

  return [data, errors];
}

function vet(schema) {
  if (typeof schema !== "object") {
    throw new Error("Schema must be an object.");
  }

  return function(req, res, next) {
    if (typeof req.body !== "object") {
      req.errors = ["Request payload must be a JSON object"];
    } else {
      const [data, errors] = validateObjectProperties(req.body, schema);
    
      req.data = data;
      req.errors = errors;
    }

    next();
  }
}

module.exports = vet;
