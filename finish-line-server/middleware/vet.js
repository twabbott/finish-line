/*
    TODO:
    ===========================
    change all schema errors to use the schemaError function
    call checkValidConstraints for all types.  this will help you in the future
    
    Arrays:
      * n-dimensional arrays
      * Allow shorthand syntax of [{schema}], or [BasicType]

    Strings:
      * regex
      * toLowerCase / toUpperCase
      * trim
      * minLength
      * maxLength

    Dates:
      * Min and Max

    All:
      * validate: a funciton that has its this-object bound to 
        the current object, and receives the current value as its property
      * message: a message to return if the current property is missing


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
    return false;
  }

  if (isNaN(Date.parse(value))) {
    errors.push(`Property "${key}" does not contain a valid date string.`);
    return false;
  }

  return true;
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
        break;

      case Date:
        if (!validateDateType(value, key, errors, constraints)) {
          continue;
        }
        break;

      default:
        if (type === Object) {
          result = ValidateSubDocument(key, value, constraints);
        } else if (type === Array) {
          result = validateArray(key, value, constraints);
        } else {
          schemaError(key, "unsupported value for property \"type\".");
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

    data[key] = value;
  }
  
  return { value: data, errors };
}

const typeMap = new Map();
typeMap.set(Boolean, "boolean");
typeMap.set(Number, "number");
typeMap.set(String, "string");
typeMap.set(Date, "string");

function checkValidConstraints(type, constraints, ...knownProps) {
  for (let key in constraints) {
    let index = -1;

    for (let i = 0; i < knownProps.length; i++) {
      if (knownProps[i] === key) {
        index = i;
        break;
      }
    }

    if (index < 0) {
      schemaError(key, `constraint is invalid for type ${type}.`);
    }
  }
}

function checkBasicType(type) {
  return !!typeMap.get(type);
}

function checkTypeForValue(key, value, type, name) {
  const typeName = typeMap.get(type);
  if (typeof value !== typeName) {
    schemaError(key, `value for property "${name}" must be a ${typeName}.`);
  }

  if (type === Date) {
    if (typeof value !== "string" || typeof value === "string" && isNaN(Date.parse(value))) {
      schemaError(key, `value for property "${name}" must be a valid date string.`);
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
  const validConstraints = ["type", "ofType", "required", "maxLength", "minLength"];

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
  
      validConstraints.push("schema");
      checkSchemaDefinition(constraints.schema, key);
    }
  }

  checkValidConstraints("Array", constraints, ...validConstraints);
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
        schemaError(key, "constraints object has invalid/unsupported value for property \"type\".");
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
    }

    if (constraints.hasOwnProperty("values")) {
      if (!Array.isArray(constraints.values)) {
        schemaError(key, "property \"values\" must be an array.");
      }

      for (let v of constraints.values) {
        checkTypeForValue(key, v, constraints.type, "values");
      }
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
