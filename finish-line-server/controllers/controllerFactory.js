const responses = require("./responses");

function errorResponse(err, res) {
  if (!err || (err && !err.isAppError)) {
    return responses.internalServerError(res, err);
  }

  responses.badRequest(res, err.message);
}

function makeGetMany(findFunc) {
  return async function(req, res) {
    let items;
    try {
      items = await findFunc(req.params, req.user);
    } catch (err) {
      return errorResponse(err, res);
    }

    return items?
      responses.ok(res, items):
      responses.badRequest(res);
  };
}

function makeGetOne(findFunc) {
  return async function(req, res) {
    let item = null;        
    try {
      item = await findFunc(req.params, req.user);
    } catch (err) {
      return errorResponse(err, res);
    }

    return item?
      responses.ok(res, item):
      responses.notFound(res, "Item not found.");
  };
}

function makePost(createFunc) {
  return async function(req, res) {
    const body = req.body;
    if (typeof body !== "object") {
      return responses.badRequest(res, "Error parsing request body.");
    }

    let newItem;
    try {
      newItem = await createFunc(req.params, req.body, req.user);
    } catch (err) {
      return errorResponse(err, res);
    }

    return newItem?
      responses.created(req, res, newItem):
      responses.badRequest(res);
  };
}

function makePut(updateFunc) {
  return async function(req, res) {
    const body = req.body;
    if (typeof body !== "object") {
      return responses.badRequest(res, "Error parsing request body.");
    }
  
    let item = null;        
    try {
      item = await updateFunc(req.params, req.body, req.user);
    } catch (err) {
      return errorResponse(err, res);
    }
  
    return item?
      responses.ok(res, item):
      responses.notFound(res, "Item not found.");
  };    
}

function makeDelete(deleteFunc) {
  return async function(req, res) {
    let count;
    try {
      count = await deleteFunc(req.params, req.user);
    } catch (err) {
      return errorResponse(err, res);
    }

    return count === 0?
      responses.notFound(res, "Item not found."):
      responses.ok(res, undefined, `Deleted ${count} item${count !== 1? "s": ""}.`);
  };
}

function autoMapper(...fields) {
  return function(inObject) {
    if (!inObject) {
      return null;
    }
    
    const outObject = {};
    
    for (let i = 0; i < fields.length; i++) {
      const key = fields[i];
      switch (typeof key) {
      case "string":
        outObject[key] = inObject[key];
        break;

      case "object":
        if (Array.isArray(key)) {
          outObject[key[1]] = inObject[key[0]];
        }
        break;
      }
    }

    return outObject;
  };
}

module.exports = {
  makeGetMany,
  makeGetOne,
  makePost,
  makePut,
  makeDelete,
  autoMapper
};
