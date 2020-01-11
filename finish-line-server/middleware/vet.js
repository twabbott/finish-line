/*
    // Step #1: Import vet
    const vet = require("../middleware/vet");

    // Step #2: define a schema middleware
    const validateBody = vet(const validateUserInfo = vet({
      name: { 
        type: String, 
        required: true 
      },
      email: {
        type: String,
        match: regex.email,
        required: true,
        maxLength: 50
      },
      password: {
        type: String,
        required: true,
        maxLength: 50
      }
    });

    // Step #3: (optional) Define an error response middleware
    function handleErrors((req, res, next) => {
      if (res.locals.errors) {
        res
          .status(400)
          .json({
            success: false,
            "Bad Request",
            errors: res.locals.errors
          });
        
        return;
      }

      next();
    });

    // Step #4: Add validation to the top when composing your pipeline
    const createUser = [
      validateBody, // vet
      handleErrors, // error handler
      createUserController, // your controller
      // etc, etc...
    ];

    app.post("/api/users", createUser);

    TODO:
    ===========================
    Arrays:
      * n-dimensional arrays
      * Allow shorthand syntax of [{schema}], or [BasicType]
*/

class VetSchemaError extends Error {
  constructor(message, propertyName, ...errorArgs) {
    super(`Vet schema error for property ${propertyName}: ${message}`, ...errorArgs);
    Error.captureStackTrace(this, VetSchemaError);

    if (propertyName) {
      this.propertyName = propertyName;
    }
  }
}

class VetValidationError extends Error {
  constructor(message = "Validation failed", errors=[], ...errorArgs) {
    super(message, ...errorArgs);
    Error.captureStackTrace(this, VetValidationError);

    this.errors = errors;
  }
}

function internalError(key, msg) {
  throw new Error(`Vet internal error while processing key ${key}: ${msg}`);
}

function validationResults(value, errorProp, errorMsg) {
  const result = {
    value,
    errors: []
  };

  if (Array.isArray(errorProp)) {
    result.errors = [...errorProp];
  } else if (typeof errorProp === "string") {
    result.errors.push({
      property: errorProp,
      message: errorMsg
    });
  }

  return result;
}

function wrappedResult(result) {
  if (result === undefined) {
    return undefined;
  } else if (result.errors.length > 0) {
    return validationResults(undefined, result.errors);
  } else {
    return validationResults(result.value);
  }
}

function addError(errors, property, message) {
  errors.push({ property, message });
}

const defaultMessages = {
  boolean: property => ({ property, message: "must be either true or false" }),
  number: property => ({ property, message: "must be a number" }),
  string: property => ({ property, message: "must be a string" })
};

function validatePrimitiveType(value, key, errors, expectedType) {
  if (typeof value !== expectedType && value !== null) {
    errors.push(defaultMessages[expectedType](key));
    return false;
  }

  return true;
}

function validateDateType(value, key, errors) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value !== "string") {
    addError(errors, key, "must be a string containing a date");
    return false;
  }

  const date = Date.parse(value);
  if (isNaN(date)) {
    addError(errors, key, "does not contain a valid date string");
    return false;
  }

  return true;
}

function ValidateSubDocument(key, value, constraints) {
  if (value === undefined) {
    if (constraints && constraints.default === null) {
      return validationResults(null);
    }

    return undefined;
  }

  if (typeof value !== "object") {
    return validationResults(undefined, key, "must contain a nested object");
  }

  if (value === null) {
    if (constraints && constraints.required) {
      return validationResults(undefined, key, "is required and may not be null");
    }

    return validationResults(null);
  }

  return wrappedResult(validateObjectProperties(constraints.schema, value)); 
}

function validateArray(key, value, constraints) {
  if (value === undefined) {
    if (constraints && constraints.default === null) {
      return validationResults(null);
    }
  
    return undefined;
  }

  if (!(typeof value === "object" && Array.isArray(value) || value === null)) {
    return validationResults(undefined, key, "must contain an array");
  }

  if (value === null) {
    if (constraints && constraints.required) {
      return validationResults(undefined, key, "is required and may not be null");
    }

    return validationResults(null);
  }

  if (constraints.maxLength && value.length > constraints.maxLength) {
    return validationResults(undefined, key, `cannot have more than ${constraints.maxLength} elments`);
  }

  if (constraints.minLength && value.length < constraints.minLength) {
    return validationResults(undefined, key, `must have at least ${constraints.minLength} elments`);
  }

  const array = [];
  const basicType = typeMap.get(constraints.ofType);
  if (basicType) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];

      if (typeof item !== basicType) {
        return validationResults(undefined, key, `must have all elements of type ${basicType}, see item at index ${i}`); 
      }

      array.push(item);
    }
  } else if (constraints.ofType === Object) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      
      const result = ValidateSubDocument(key, item, constraints);
      if (result.errors.length > 0) {
        return validationResults(undefined, result.errors);
      }

      array.push(result.value);
    }
  } else {
    internalError(key, "ofType property contains a type that is not supported.");
  }

  return validationResults(array);
}

function validateObjectProperties(schema, obj) {
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
      if (constraints) {
        if (constraints.default !== undefined) {
          data[key] = constraints.default;
        } else if (constraints.required) {
          addError(errors, key, "is required");
        }
      }
  
      continue;
    }

    let value = obj[key];
    let result;
    switch(type) {
      case Boolean:
        if (!validatePrimitiveType(value, key, errors, "boolean")) {
          continue;
        }
        break;

      case Number:
        if (!validatePrimitiveType(value, key, errors, "number")) {
          continue;
        }

        if (constraints) {
          if (constraints.trunc) {
            value = Math.trunc(value);
          }

          if (constraints.min && value < constraints.min) {
            addError(errors, key, `is below the minimum value of ${constraints.min}`);
            continue;
          }
    
          if (constraints.max && value > constraints.max) {
            addError(errors, key, `is above the maximum value of ${constraints.max}`);
            continue;
          }
        }
        break;

      case String:
        if (!validatePrimitiveType(value, key, errors, "string")) {
          continue;
        }

        if (constraints) {
          if (value === null && constraints.required) {
            addError(errors, key, "is required, and cannot be null");
            continue;
          }

          if (value !== null) {
            if (constraints.minLength >= 0 && value.length < constraints.minLength) {
              addError(errors, key, `must be at least ${constraints.minLength} characters long`);
              continue;
            }
  
            if (constraints.maxLength >= 0 && value.length > constraints.maxLength) {
              addError(errors, key, `must be no more than ${constraints.maxLength} characters long`);
              continue;
            }
  
            if (constraints.toLowerCase) {
              value = value.toLowerCase();
            }
  
            if (constraints.toUpperCase) {
              value = value.toUpperCase();
            }
  
            if (constraints.trim) {
              value = value.trim();
            }
  
            if (constraints.match && !constraints.match.test(value)) {
              addError(errors, key, "is invalid");
              continue;
            }
          }
        }
        break;

      case Date:
        if (!validateDateType(value, key, errors)) {
          continue;
        }

        if (constraints) {
          if (value === null) {
            if (constraints.required) {
              addError(errors, key, "is required, and cannot be null");
              continue;
            } else if (value === undefined) {
              continue;
            }
          } else {
            if (value < constraints.min) {
              addError(errors, key, `cannot have date earlier than "${constraints.min}"`);
              continue;
            }
      
            if (value > constraints.max) {
              addError(errors, key, `cannot have date later than "${constraints.max}"`);
              continue;
            }
          }
        }
        break;

      default:
        if (type === Object) {
          result = ValidateSubDocument(key, value, constraints);
        } else if (type === Array) {
          result = validateArray(key, value, constraints);
        } else {
          throw new VetSchemaError("unsupported value for constraint \"type\".", key);
        }

        if (result === undefined) {
          continue;
        } else if (result.errors.length > 0) {
          errors.push(...result.errors);
          continue;
        } else {
          value = result.value;
        }
        break;
    }

    // Now do constraints that apply to all types
    if (constraints) {
      if (constraints.values && constraints.values.indexOf(value) < 0) {
        addError(errors, key, `has an invalid value of ${value}`);
        continue;
      }
  
      if (constraints.validate) {
        try {
          const newValue = constraints.validate(value);
          if (newValue !== undefined) {
            value = newValue;
          }
        } catch (err) {
          addError(errors, key, `has an invalid value: ${err.message}`);
          continue;
        }
      }
    } 

    data[key] = value;
  }

  for (let key in obj) {
    if (!schema.hasOwnProperty(key)) {
      let msg = `unknown property`;
      for (let schemaKey in schema) {
        if (key.toLowerCase() === schemaKey.toLowerCase()) {
          msg += `, did you mean to specify "${schemaKey}"?`;
        }
      }
      
      addError(errors, key, msg);
    }
  }

  return validationResults(data, errors);
}

const typeMap = new Map();
typeMap.set(Boolean, "boolean");
typeMap.set(Number, "number");
typeMap.set(String, "string");
typeMap.set(Date, "string");

function checkBasicType(type) {
  return !!typeMap.get(type);
}

function checkTypeForValue(key, value, type, name) {
  const typeName = typeMap.get(type);
  if (typeof value !== typeName) {
    throw new VetSchemaError(`value for constraint "${name}" must be a ${typeName}.`, key);
  }

  if (type === Date) {
    if (typeof value !== "string" || typeof value === "string" && isNaN(Date.parse(value))) {
      throw new VetSchemaError(`value for constraint "${name}" must be a valid date string.`, key);
    }
  }
}

function checkObject(key, constraints) {
  if (!constraints.hasOwnProperty("schema")) {
    throw new VetSchemaError("when type is Object, property \"schema\" is required.", key);
  }
  
  checkSchemaDefinition(constraints.schema, key);

  if (constraints.hasOwnProperty("default") && constraints.default !== null) {
    throw new VetSchemaError("when type is Object, property \"default\" may only have a value of null.", key);
  }
}

function checkArray(key, constraints) {
  if (!constraints.hasOwnProperty("ofType")) {
    throw new VetSchemaError("when type is Array, property \"ofType\" is required.", key);
  }
  
  if (constraints.hasOwnProperty("maxLength")) {
    if (typeof constraints.maxLength !== "number") {
      throw new VetSchemaError("property \"maxLength\" must be a number.", key);
    }

    if (constraints.maxLength < 0) {
      throw new VetSchemaError("property \"maxLength\" cannot be less than zero.", key);
    }
  }

  if (constraints.hasOwnProperty("minLength")) {
    if (typeof constraints.minLength !== "number") {
      throw new VetSchemaError("property \"minLength\" must be a number.", key);
    }

    if (constraints.minLength < 0) {
      throw new VetSchemaError("property \"minLength\" cannot be less than zero.", key);
    }

    if (constraints.maxLength && constraints.minLength > constraints.maxLength) {
      throw new VetSchemaError("property \"minLength\" cannot be greater than maxLength.", key);
    }
  }

  if (!checkBasicType(constraints.ofType)) {
    if (constraints.ofType === Object) {
      if (!constraints.hasOwnProperty("schema")) {
        throw new VetSchemaError("when type is Array and property \"ofType\" is Object, property \"schema\" is required.", key);
      }
  
      checkSchemaDefinition(constraints.schema, key);
    }
  }
}

function checkSchemaDefinition(schema, parentKey) {
  if (!schema || (schema && (typeof schema !== "object" || Array.isArray(schema)))) {
    let err = "Invalid schema definition, schema must be an object.";
    if (parentKey) {
      throw new VetSchemaError(err, parentKey);
    }

    throw new Error(err);
  }

  for (let key in schema) {
    const constraints = schema[key];

    if (!constraints) {
      throw new VetSchemaError("constraints object expected.", key);
    }

    if (checkBasicType(constraints)) {
      // Simple type constraint (Boolean, Number, String, Date, etc.)
      continue;
    }

    if (typeof constraints !== "object") {
      throw new VetSchemaError("expected primitive type, or Date, or constraints object.", key);
    }

    // At this point, we're looking at a constraints object.
    if (!constraints.hasOwnProperty("type")) {
      throw new VetSchemaError("constraints object must have property \"type\".", key);
    }

    if (!checkBasicType(constraints.type)) {
      if (constraints.type === Object) {
        checkObject(key, constraints);
      } else if(constraints.type === Array) {
        checkArray(key, constraints);
      } else {
        throw new VetSchemaError("constraints object has invalid/unsupported value for constraint \"type\".", key);
      }
    }

    if (constraints.hasOwnProperty("default") && constraints.default !== null) {
      checkTypeForValue(key, constraints.default, constraints.type, "default");
    }

    if (constraints.type === Number) {
      if (constraints.hasOwnProperty("trunc") && typeof constraints.trunc !== "boolean") {
        throw new VetSchemaError("value must be either true or false.", key);
      }

      if (constraints.hasOwnProperty("min")) {
        checkTypeForValue(key, constraints.min, constraints.type, "min");
      }

      if (constraints.hasOwnProperty("max")) {
        checkTypeForValue(key, constraints.max, constraints.type, "max");
      }

      if (constraints.hasOwnProperty("min") && constraints.hasOwnProperty("max") && constraints.min > constraints.max) {
        throw new VetSchemaError("min constraint cannot be greater than max constraint.", key);
      }
    } else if (constraints.type === String) {
      if (constraints.hasOwnProperty("toLowerCase") && typeof constraints.toLowerCase !== "boolean") {
        throw new VetSchemaError("value for constraint \"toLowerCase\" must be either true or false.", key);
      }

      if (constraints.hasOwnProperty("toUpperCase") && typeof constraints.toUpperCase !== "boolean") {
        throw new VetSchemaError("value for constraint \"toUpperCase\" must be either true or false.", key);
      }

      if (constraints.toLowerCase === true && constraints.toUpperCase === true) {
        throw new VetSchemaError("cannot have both toLowerCase and toUpperCase set to true.", key);
      }

      if (constraints.hasOwnProperty("trim") && typeof constraints.trim !== "boolean") {
        throw new VetSchemaError("value for constraint \"trim\" must be either true or false.", key);
      }

      if (constraints.hasOwnProperty("minLength") && typeof constraints.minLength !== "number") {
        throw new VetSchemaError("value for constraint \"minLength\" must be a number.", key);
      }

      if (constraints.hasOwnProperty("maxLength") && typeof constraints.maxLength !== "number") {
        throw new VetSchemaError("value for constraint \"maxLength\" must be a number.", key);
      }

      if (constraints.hasOwnProperty("minLength") && constraints.hasOwnProperty("maxLength") && constraints.minLength > constraints.maxLength) {
        throw new VetSchemaError("value for constraint \"minLength\" cannot be greater than \"maxLength\".", key);
      }

      if (constraints.hasOwnProperty("match") && !(constraints.match instanceof RegExp)) {
        throw new VetSchemaError("Value for constraint \"match\" must be a regular expression.", key);
      }
    } else if (constraints.type === Date) {
      if (constraints.hasOwnProperty("min")) {
        checkTypeForValue(key, constraints.min, constraints.type, "min");
      }

      if (constraints.hasOwnProperty("max")) {
        checkTypeForValue(key, constraints.max, constraints.type, "max");
      }

      if (constraints.hasOwnProperty("min") && constraints.hasOwnProperty("max") && constraints.min > constraints.max) {
        throw new VetSchemaError("min constraint cannot be greater than max constraint.", key);
      }
    }

    if (constraints.hasOwnProperty("values")) {
      if (!Array.isArray(constraints.values)) {
        throw new VetSchemaError("property \"values\" must be an array.", key);
      }

      for (let v of constraints.values) {
        checkTypeForValue(key, v, constraints.type, "values");
      }
    }

    if (constraints.hasOwnProperty("validate") && typeof constraints.validate !== "function") {
      throw new VetSchemaError("value for constraint \"validate\" must be a function.", key);
    }
  }
}

function vet(schema) {
  checkSchemaDefinition(schema);

  return (obj) => validateObjectProperties(schema, obj);
}

function vetMiddleware(schema) {
  const validator = vet(schema);

  function middleware(req, res, next) {
    if (typeof req.body !== "object") {
      req.errors = ["Request payload must be a JSON object"];
    } else {
      const result = validator(req.body);
      
      if (result.errors.length === 0) {
        Object.assign(req.body, result.value);
      } else {
        res.locals.errors = result.errors;
      }
    }

    next();
  }

  return middleware;
}

module.exports = {
  vet,
  vetMiddleware,
  VetSchemaError,
  VetValidationError,
  utilities: {
    checkSchemaDefinition,
    validateObjectProperties
  }
};
