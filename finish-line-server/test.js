const express = require("express");
const app = express();

const port = 3000;

const repartee = require("./middleware/repartee");
app.use(repartee.responses());

app.get('*',  
  (req, res, next) => {
    // Echo back the query string
    res.ok({
      query: req.query
    });
  }
);

app.listen(port, () => { 
  console.log(`Server running on port ${port}`);
  console.log(`View at: http://localhost:${port}`);
});
