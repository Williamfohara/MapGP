const express = require("express");

const handler = (req, res) => {
  res.send("Test route is working!");
};

module.exports = express().get(handler);
