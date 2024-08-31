const express = require("express");
const cors = require("cors");
const app = express(); // Create an Express application

app.use(cors()); // Enable CORS

// Define a route handler for the `/test` endpoint
app.get("/api/test", (req, res) => {
  res.send("Test route is working!");
});

// Export the Express app instance
module.exports = app;
