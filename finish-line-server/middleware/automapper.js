/* The purpose of this function is to perform some quick renaming on the res.response object
 *
 * The map array can have two kinds of elmenets
 *   - a string containing the name of a property to retain.
 *   - An array containing a property name (string), plus a second string that you
 *     want said property renamed to
 */

function validateMap(map) {
  if (!Array.isArray(map)) {
    throw new Error("autoMapper map must be an array");
  }

  for (let i = 0; i < map.length; i++) {
    const item = map[i];

    if (typeof item === "string") {
      continue;
    }

    if (Array.isArray(item)) {
      if (typeof item[0] === "string" && typeof item[1] === "string") {
        continue;
      }
    }

    throw new Error(`autoMapper map has invalid item at index ${i}.  Item must be either a string, or an array of two strings.`);
  }
}

function createMap(map) {
  validateMap(map);

  function mapObject(inObj) {
    const outObj = {};
    for (let prop of map) {
      let key = prop;
      let outKey = prop;
      if (Array.isArray(prop)) {
        key = prop[0];
        outKey = prop[1];
      }

      if (typeof inObj[key] !== undefined) {
        outObj[outKey] = inObj[key];
      }
    } 

    return outObj;
  }

  function mapScalar(req, res, next) {
    //console.log("autoMapper - start");

    if (!res.locals || !res.locals.result || typeof res.locals.result !== "object") {
      //console.log("autoMapper - nothing to do");
      next();
      return;
    }

    res.locals.result = mapObject(res.locals.result);
    //console.log("autoMapper = done");
    next();
  }

  function mapArray(req, res, next) {
    if (!res.locals || !res.locals.result || typeof res.locals.result !== "object") {
      //console.log("autoMapper - nothing to do");
      next();
      return;
    }

    const outArray = [];
    for (let item of res.locals.result) {
      outArray.push(mapObject(item));
    }
    res.locals.result = outArray;
    //console.log("autoMapper = done");
    next();
  }

  return {
    mapScalar,
    mapArray
  };
}

module.exports = {
  createMap
};
