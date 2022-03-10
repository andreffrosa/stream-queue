const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const port = 80;

// Configure Express
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create jobs path router
var router = express.Router();

// Start API Server
app.listen(port, () => {
    console.log(`Listening on port ${port} ...`);
})
