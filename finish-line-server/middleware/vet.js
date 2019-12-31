/*
    TODO:
    ===========================
    Arrays:
      * n-dimensional arrays
      * Allow shorthand syntax of [{schema}], or [BasicType]
*/

function internalError(key, msg) {
  throw new Error(`Vet internal error while processing key ${key}: ${msg}`);
}

function schemaError(key, msg) {
  throw new Error(`Vet schema error for property ${key}: ${msg}`);
}

function wrappedResult(result) {
  if (result === undefined) {
    return undefined;
  } else if (result.errors.length > 0) {
    return { value: undefined, errors: result.errors };
  } else {
    return { value: result.value, errors: [] };
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
    return undefined;
  }

  const date = Date.parse(value);
  if (isNaN(date)) {
    errors.push(`Property "${key}" does not contain a valid date string.`);
    return undefined;
  }

  return date;
}

function ValidateSubDocument(key, value, constraints) {
  if (value === undefined) {
    if (constraints && constraints.default === null) {
      return { value: null, errors: [] };
    }

    return undefined;
  }

  if (typeof value !== "object") {
    return { value: undefined, errors: [`Property "${key}" must contain a nested object.`] };
  }

  if (value === null) {
    if (constraints && constraints.required) {
      return { value: undefined, errors: [`Property "${key}" is required and may not be null.`]};
    }

    return { value: null, errors: []};
  }

  return wrappedResult(validateObjectProperties(value, constraints.schema)); 
}

function validateArray(key, value, constraints) {
  if (value === undefined) {
    if (constraints && constraints.default === null) {
      return { value: null, errors: [] };
    }
  
    return undefined;
  }

  if (!(typeof value === "object" && Array.isArray(value) || value === null)) {
    return { value: undefined, errors: [`Property "${key}" must contain an array.`] };
  }

  if (value === null) {
    if (constraints && constraints.required) {
      return { value: undefined, errors: [`Property "${key}" is required and may not be null.`]};
    }

    return { value: null, errors: []};
  }

  if (constraints.maxLength && value.length > constraints.maxLength) {
    return { value: undefined, errors: [`Property "${key}" cannot have more than ${constraints.maxLength} elments in its array.`]}
  }

  if (constraints.minLength && value.length < constraints.minLength) {
    return { value: undefined, errors: [`Property "${key}" must have at least ${constraints.minLength} elments in its array.`]}
  }

  const array = [];
  const basicType = typeMap.get(constraints.ofType);
  if (basicType) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];

      if (typeof item !== basicType) {
        return {
          value: undefined,
          errors: [`Property "${key}" must have all elements of type ${basicType}. See item at index ${i}.`] 
        };
      }

      array.push(item);
    }
  } else if (constraints.ofType === Object) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      
      const result = ValidateSubDocument(key, item, constraints);
      if (result.errors.length > 0) {
        return { value: undefined, errors: result.errors };
      }

      array.push(result.value);
    }
  } else {
    internalError(key, `ofType property contains a type that is not supported.`);
  }

  return { value: array, errors: [] };
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
    let result;
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

        if (constraints) {
          if (constraints.trunc) {
            value = Math.trunc(value);
          }

          if (constraints.min && value < constraints.min) {
            errors.push(`Property "${key}" is below the minimum value of ${constraints.min}.`);
            continue;
          }
  
          if (constraints.max && value > constraints.max) {
            errors.push(`Property "${key}" is above the maximum value of ${constraints.max}.`);
            continue;
          }
        }
        break;

      case String:
        if (!validatePrimitiveType(value, key, errors, "string")) {
          continue;
        };

        if (constraints) {
          if (constraints.minLength >= 0 && value.length < constraints.minLength) {
            errors.push(`Property "${key}" must be at least ${constraints.minLength} characters long.`);
            continue;
          }

          if (constraints.maxLength >= 0 && value.length > constraints.maxLength) {
            errors.push(`Property "${key}" must be no more than ${constraints.maxLength} characters long.`);
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
            errors.push(`Value for property "${key}" is invalid.`);
            continue;
          }
        }
        break;

      case Date:
        let date = validateDateType(value, key, errors, constraints);
        if (!date) {
          continue;
        }

        if (constraints) {
          if (date < constraints.minDate) {
            errors.push(`Value for property "${key}" cannot have date earlier than \"${constraints.min}\".`);
            continue;
          }
  
          if (date > constraints.maxDate) {
            errors.push(`Value for property "${key}" cannot have date later than \"${constraints.max}\".`);
            continue;
          }
        }
        break;

      default:
        if (type === Object) {
          result = ValidateSubDocument(key, value, constraints);
        } else if (type === Array) {
          result = validateArray(key, value, constraints);
        } else {
          schemaError(key, "unsupported value for constraint \"type\".");
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

    if (constraints && constraints.values && constraints.values.indexOf(value) < 0) {
      errors.push(`Property "${key}" has an invalid value of ${value}.`);
      continue;
    }

    if (constraints && constraints.validate) {
      try {
        const newValue = constraints.validate(value);
        if (newValue !== undefined) {
          value = newValue;
        }
      } catch (err) {
        errors.push(`Property "${key}" has an invalid value. ${err.message}`);
        continue;
      }
    }

    data[key] = value;
  }
  
  return { value: data, errors };
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
    schemaError(key, `value for constraint "${name}" must be a ${typeName}.`);
  }

  if (type === Date) {
    if (typeof value !== "string" || typeof value === "string" && isNaN(Date.parse(value))) {
      schemaError(key, `value for constraint "${name}" must be a valid date string.`);
    }
  }
}

function checkObject(key, constraints) {
  if (!constraints.hasOwnProperty("schema")) {
    schemaError(key, "when type is Object, property \"schema\" is required.");
  }
  
  checkSchemaDefinition(constraints.schema, key);

  if (constraints.hasOwnProperty("default") && constraints.default !== null) {
    schemaError(key, "when type is Object, property \"default\" may only have a value of null.");
  }
}

function checkArray(key, constraints) {
  if (!constraints.hasOwnProperty("ofType")) {
    schemaError(key, "when type is Array, property \"ofType\" is required.");
  }
  
  if (constraints.hasOwnProperty("maxLength")) {
    if (typeof constraints.maxLength !== "number") {
      schemaError(key, "property \"maxLength\" must be a number.");
    }

    if (constraints.maxLength < 0) {
      schemaError(key, "property \"maxLength\" cannot be less than zero.");
    }
  }

  if (constraints.hasOwnProperty("minLength")) {
    if (typeof constraints.minLength !== "number") {
      schemaError(key, "property \"minLength\" must be a number.");
    }

    if (constraints.minLength < 0) {
      schemaError(key, "property \"minLength\" cannot be less than zero.");
    }

    if (constraints.maxLength && constraints.minLength > constraints.maxLength) {
      schemaError(key, "property \"minLength\" cannot be greater than maxLength.");
    }
  }

  if (!checkBasicType(constraints.ofType)) {
    if (constraints.ofType === Object) {
      if (!constraints.hasOwnProperty("schema")) {
        schemaError(key, "when type is Array and property \"ofType\" is Object, property \"schema\" is required.");
      }
  
      checkSchemaDefinition(constraints.schema, key);
    }
  }
}

function checkSchemaDefinition(schema, parentKey) {
  if (!schema || (schema && (typeof schema !== "object" || Array.isArray(schema)))) {
    let err = "Invalid schema definition, schema must be an object.";
    if (parentKey) {
      schemaError(parentKey, err);
    }

    throw new Error(err);
  }

  for (let key in schema) {
    const constraints = schema[key];

    if (!constraints) {
      schemaError(key, "constraints object expected.");
    }

    if (checkBasicType(constraints)) {
      // Simple type constraint (Boolean, Number, String, Date, etc.)
      continue;
    }

    if (typeof constraints !== "object") {
      schemaError(key, "expected primitive type, or Date, or constraints object.");
    }

    // At this point, we're looking at a constraints object.
    if (!constraints.hasOwnProperty("type")) {
      schemaError(key, "constraints object must have property \"type\".");
    }

    if (!checkBasicType(constraints.type)) {
      if (constraints.type === Object) {
        checkObject(key, constraints);
      } else if(constraints.type === Array) {
        checkArray(key, constraints);
      } else {
        schemaError(key, "constraints object has invalid/unsupported value for constraint \"type\".");
      }
    }

    if (constraints.hasOwnProperty("default") && constraints.default !== null) {
      checkTypeForValue(key, constraints.default, constraints.type, "default");
    }

    if (constraints.type === Number) {
      if (constraints.hasOwnProperty("trunc") && typeof constraints.trunc !== "boolean") {
        schemaError(key, "value must be either true or false.");
      }

      if (constraints.hasOwnProperty("min")) {
        checkTypeForValue(key, constraints.min, constraints.type, "min");
      }

      if (constraints.hasOwnProperty("max")) {
        checkTypeForValue(key, constraints.max, constraints.type, "max");
      }

      if (constraints.hasOwnProperty("min") && constraints.hasOwnProperty("max") && constraints.min > constraints.max) {
        schemaError(key, "min constraint cannot be greater than max constraint.");
      }
    } else if (constraints.type === String) {
      if (constraints.hasOwnProperty("toLowerCase") && typeof constraints.toLowerCase !== "boolean") {
        schemaError(key, "value for constraint \"toLowerCase\" must be either true or false.");
      }

      if (constraints.hasOwnProperty("toUpperCase") && typeof constraints.toUpperCase !== "boolean") {
        schemaError(key, "value for constraint \"toUpperCase\" must be either true or false.");
      }

      if (constraints.toLowerCase === true && constraints.toUpperCase === true) {
        schemaError(key, "cannot have both toLowerCase and toUpperCase set to true.");
      }

      if (constraints.hasOwnProperty("trim") && typeof constraints.trim !== "boolean") {
        schemaError(key, "value for constraint \"trim\" must be either true or false.");
      }

      if (constraints.hasOwnProperty("minLength") && typeof constraints.minLength !== "number") {
        schemaError(key, "value for constraint \"minLength\" must be a number.");
      }

      if (constraints.hasOwnProperty("maxLength") && typeof constraints.maxLength !== "number") {
        schemaError(key, "value for constraint \"maxLength\" must be a number.");
      }

      if (constraints.hasOwnProperty("minLength") && constraints.hasOwnProperty("maxLength") && constraints.minLength > constraints.maxLength) {
        schemaError(key, "value for constraint \"minLength\" cannot be greater than \"maxLength\".");
      }

      if (constraints.hasOwnProperty("match") && !(constraints.match instanceof RegExp)) {
        schemaError(key, "Value for constraint \"match\" must be a regular expression.")
      }
    } else if (constraints.type === Date) {
      if (constraints.hasOwnProperty("min")) {
        checkTypeForValue(key, constraints.min, constraints.type, "min");
        constraints.minDate = Date.parse(constraints.min);
      }

      if (constraints.hasOwnProperty("max")) {
        checkTypeForValue(key, constraints.max, constraints.type, "max");
        constraints.maxDate = Date.parse(constraints.max);
      }

      if (constraints.hasOwnProperty("min") && constraints.hasOwnProperty("max") && constraints.min > constraints.max) {
        schemaError(key, "min constraint cannot be greater than max constraint.");
      }
    }

    if (constraints.hasOwnProperty("values")) {
      if (!Array.isArray(constraints.values)) {
        schemaError(key, "property \"values\" must be an array.");
      }

      for (let v of constraints.values) {
        checkTypeForValue(key, v, constraints.type, "values");
      }
    }

    if (constraints.hasOwnProperty("validate") && typeof constraints.validate !== "function") {
      schemaError(key, "value for constraint \"validate\" must be a function.");
    }
  }
}

function vet(schema) {
  checkSchemaDefinition(schema);

  return function(req, res, next) {
    if (typeof req.body !== "object") {
      req.errors = ["Request payload must be a JSON object"];
    } else {
      const result = validateObjectProperties(req.body, schema);
    
      req.data = result.value;
      req.errors = result.errors;
    }

    next();
  }
}

module.exports = vet;
