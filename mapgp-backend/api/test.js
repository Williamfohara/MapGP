const express = require("express");
const app = express(); // Create an Express application

// Define a route handler for the `/test` endpoint
app.get("/api/test", (req, res) => {
  res.send("Test route is working!");
});

// Export the Express app instance
module.exports = app;
