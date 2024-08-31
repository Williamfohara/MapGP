const express = require("express");
const {
  handleGenerateSummaryRequest,
} = require("../manualDBManipulation/generateMissingSummary.js");

const handler = (req, res) => {
  handleGenerateSummaryRequest(req, res);
};

module.exports = express().post(handler);
