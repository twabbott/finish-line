

const sampleSchema = {
  name: String,
  height: Number,
  isVeteran: Boolean,
  birthday: Date,
  address: {

  }
}

const defaultMessages = {
  boolean: key => `Property "${key}" must be either true or false.`,
  number: key => `Property "${key}" must be a number.`,
  string: key => `Property "${key}" must be a string.`
};

function validatePrimitiveType(value, key, errors, expectedType) {
  if (typeof value !== expectedType) {
    errors.push(defaultMessages[expectedType](key));
    return false;
  }

  return true;
}

function validateDateType(value, key, errors) {
  if (typeof value !== "string") {
    errors.push(`Property "${key}" must be a string containing a date.`);
    return false;
  }

  if (isNaN(Date.parse(value))) {
    errors.push(`Property "${key}" does not contain a valid date string.`);
    return false;
  }

  return true;
}

function validateObjectProperties(obj, schema) {
  const data = {};
  const errors = [];

  for (let key in schema) {
    let type = schema[key];
    let constraints = null;
    if (typeof schema[key] === "object") {
      constraints = schema[key];
      type = constraints.type;
    }

    if (!obj.hasOwnProperty(key)) {
      if (!constraints) {
        continue;
      }
  
      if (constraints.hasOwnProperty("default")) {
        data[key] = constraints.default;
        continue;
      }
  
      if (constraints.required) {
        errors.push(`Property "${key}" is required.`);
        continue;
      }
    }

    let value = obj[key];

    switch(type) {
      case Boolean:
        if (!validatePrimitiveType(value, key, errors, "boolean")) {
          continue;
        };
        break;

      case Number:
        if (!validatePrimitiveType(value, key, errors, "number")) {
          continue;
        };

        if (constraints && constraints.min && value < constraints.min) {
          errors.push(`Property "${key}" is below the minimum value of ${constraints.min}.`);
          continue;
        }

        if (constraints && constraints.max && value > constraints.max) {
          errors.push(`Property "${key}" is above the maximum value of ${constraints.max}.`);
          continue;
        }
        break;

      case String:
        if (!validatePrimitiveType(value, key, errors, "string")) {
          continue;
        };
        break;

      case Date:
        if (!validateDateType(value, key, errors, constraints)) {
          continue;
        }
        break;
  
      default:
        throw new Error(`Schema property ${key} has unsupported type.`);
        break;
    }

    if (constraints && constraints.values && constraints.values.indexOf(value) < 0) {
      errors.push(`Property "${key}" has an invalid value of ${value}.`);
      continue;
    }

    data[key] = value;
  }
  
  return [data, errors];
}

const typeMap = new Map();
typeMap.set(Boolean, "boolean");
typeMap.set(Number, "number");
typeMap.set(String, "string");
typeMap.set(Date, "string");

function isSupportedType(type) {
  return !!typeMap.get(type);
}

function checkTypeForValue(key, value, type, name) {
  const typeName = typeMap.get(type);
  if (typeof value !== typeName) {
    throw new Error(`Property ${key} has invalid value for ${name} constraint.  Value must be a ${typeName}.`);
  }
  
  if (type === Date) {
    if (typeof value !== "string" || typeof value === "string" && isNaN(Date.parse(value))) {
      throw new Error(`Property ${key} has invalid value for ${name} constraint.  Value must be a valid date string.`);
    }
  }
}

function errorCheck(schema) {
  if (typeof schema !== "object") {
    throw new Error("Schema must be an object.");
  }

  const errors = [];
  for (let key in schema) {
    const constraints = schema[key];

    if (!constraints) {
      throw new Error(`Invalid constraints for property ${key}.`);
    }

    if (isSupportedType(constraints)) {
      // Simple type constraint (Boolean, Number, String, Date, etc.)
      continue;
    }

    if (typeof constraints !== "object") {
      throw new Error(`Property ${key} has unsupported type.`);
    }

    // At this point, we're looking at a constraints object.
    if (!constraints.hasOwnProperty("type")) {
      throw new Error(`Constraints object for ${key} must have type property.`);
    }

    if (!isSupportedType(constraints.type)) {
      throw new Error(`Constraints object for property ${key} has invalid/unsupported type.`);
    }

    if (constraints.hasOwnProperty("default") && constraints.default !== null) {
      checkTypeForValue(key, constraints.default, constraints.type, "default");
    }

    if (constraints.type === Number) {
      if (constraints.hasOwnProperty("min")) {
        checkTypeForValue(key, constraints.min, constraints.type, "min");
      }
      if (constraints.hasOwnProperty("max")) {
        checkTypeForValue(key, constraints.max, constraints.type, "max");
      }

      if (constraints.hasOwnProperty("min") && constraints.hasOwnProperty("max") && constraints.min > constraints.max) {
        throw new Error(`Property ${key} has min constraint that is greater than max constraint.`);
      }
    }

    if (constraints.hasOwnProperty("values")) {
      if (!Array.isArray(constraints.values)) {
        throw new Error(`Property ${key} has invalid values constraint.  Expected an array of values.`);
      }

      for (let v of constraints.values) {
        checkTypeForValue(key, v, constraints.type, "values");
      }
    }
  }

  return errors;
}

function vet(schema) {
  errorCheck(schema);

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
