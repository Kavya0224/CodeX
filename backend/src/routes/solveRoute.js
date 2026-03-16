const express = require("express");
const router = express.Router();

// Import controller instead of writing logic directly in route
const { solveProblem } = require("../controllers/solveController");

/*
  POST /solve

  Route layer should stay thin.
  Its job is mainly to map URL -> controller.
*/
router.post("/", solveProblem);

module.exports = router;