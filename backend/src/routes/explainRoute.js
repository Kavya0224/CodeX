const express = require("express");
const router = express.Router();
const { explainProblemCode } = require("../controllers/explainController");

router.post("/", explainProblemCode);

module.exports = router;