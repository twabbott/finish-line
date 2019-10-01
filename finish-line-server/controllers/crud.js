const responses = require("./responses");
const folderSchema = require("../models/folder.model");

module.exports = function(schema, collectionName, mapFunc) {
  const crud = {};

  crud.createItem = async function(req, res) {
    const body = req.body;
    if (typeof body !== "object") {
      return responses.badRequest(res, "Error parsing request body.");
    }

    const newItem = new schema();
    mapFunc(newItem, body, true);

    try {
      try {
        await newItem.save();
      } catch (err) {
        return responses.badRequest(res, err.message);
      }

      return responses.created(req, res, newItem);
    } catch (err) {
      return responses.internalServerError(res, err);
    }
  };

  crud.readAllItems = async function(req, res) {
    try {
      const items = await schema.find();
      return responses.ok(res, items);
    } catch(err) {
      return responses.internalServerError(res, err);
    }
  };  

  crud.readItem = async function(req, res) {
    try {
      let item = null;
      
      try {
        item = await folderSchema.findById(req.params.id);
      } catch (err) {
        console.log(err);
      }
      if (!item) {
        return responses.notFound(res, `${collectionName} _id=${req.params.id} not found.`);
      }

      return responses.ok(res, item);
    } catch (err) {
      return responses.internalServerError(res, err);
    }
  };

  crud.updateItem = async function(req, res) {
    const body = req.body;
    if (typeof body !== "object") {
      return responses.badRequest(res, "Error parsing request body.");
    }
  
    console.log(`PUT ${req.params.id} ==> ${JSON.stringify(body)}`);
    let item = null;
      
    try {
      item = await schema.findById(req.params.id);
    } catch (err) {
      console.log(err);
    }
    if (!item) {
      return responses.notFound(res, `${collectionName} _id=${req.params.id} not found.`);
    }
  
    mapFunc(item, body, false);
  
    try {
      await item.save();
  
      return responses.ok(res, item);
    } catch (err) {
      return responses.badRequest(res, err.message);
    }
  };
  
  crud.deleteItem = async function(req, res) {
    try {
      let found = false;
      try {
        const result = await schema.deleteOne({ _id: req.params.id });
        found = result && result.deletedCount > 0;
      } catch (err) {
        console.log(err);
      }
      if (!found) {
        return responses.notFound(res, `${collectionName} _id=${req.params.id} not found.`);
      }
  
      return responses.noContent(res);
    } catch (err) {
      return responses.internalServerError(res, err);
    }
  };

  return crud;
}



