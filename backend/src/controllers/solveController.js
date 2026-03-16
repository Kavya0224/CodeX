const { processProblem } = require("../services/solveService");

const solveProblem = async (req, res) => {
  try {
    // Read problem, language, and optional stdin from request
    const { problem, language, stdin } = req.body;

    if (!problem || problem.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Problem statement is required"
      });
    }

    const result = await processProblem({
      problem,
      language,
      stdin: stdin || ""
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("SOLVE CONTROLLER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while solving the problem",
      error: error.message
    });
  }
};

module.exports = {
  solveProblem
};