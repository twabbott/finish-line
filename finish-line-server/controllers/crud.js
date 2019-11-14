const responses = require("./responses");

module.exports = {
  create(createFunc) {
    return async function(req, res) {
      const body = req.body;
      if (typeof body !== "object") {
        return responses.badRequest(res, "Error parsing request body.");
      }

      let newItem;
      try {
        newItem = await createFunc(req.params, req.body, req.user);
      } catch (err) {
        return err?
          responses.badRequest(res, err.message):
          responses.internalServerError(res, err);
      }
  
      return newItem?
        responses.created(req, res, newItem):
        responses.badRequest(res);
    };
  },

  readAll(findFunc) {
    return async function(req, res) {
      let items;
      try {
        items = await findFunc(req.params, req.user);
      } catch (err) {
        return err?
          responses.badRequest(res, err.message):
          responses.internalServerError(res, err);
      }

      return items?
        responses.ok(res, items):
        responses.badRequest(res);
    };
  },

  read(findFunc) {
    return async function(req, res) {
      let item = null;        
      try {
        item = await findFunc(req.params, req.user);
      } catch (err) {
        return err?
          responses.badRequest(res, err.message):
          responses.internalServerError(res, err);
      }

      return item?
        responses.ok(res, item):
        responses.notFound(res, `Item not found.`);
    };
  },

  update(updateFunc) {
    return async function(req, res) {
      const body = req.body;
      if (typeof body !== "object") {
        return responses.badRequest(res, "Error parsing request body.");
      }
    
      let item = null;        
      try {
        item = await updateFunc(req.params, req.body, req.user);
      } catch (err) {
        return err?
          responses.badRequest(res, err.message):
          responses.internalServerError(res, err);
      }
    
      return item?
        responses.ok(res, item):
        responses.notFound(res, `Item not found.`);
    };    
  },

  delete(deleteFunc) {
    return async function(req, res) {
      let found = false;
      try {
        found = await deleteFunc(req.params, req.user)
      } catch (err) {
        return err?
          responses.badRequest(res, err.message):
          responses.internalServerError(res, err);
      }

      return found?
        responses.noContent(res):
        responses.notFound(res, `Item not found.`);
    };    
  }
}



