const { processProblem } = require("../services/solveService");

const solveProblem = async (req, res) => {
  try {
    const {
      problem,
      language,
      stdin,
      expectedOutput,
      testCases,
      publicTests,
      hiddenTests
    } = req.body;

    if (!problem || problem.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Problem statement is required"
      });
    }

    const result = await processProblem({
      problem,
      language,
      stdin: stdin || "",
      expectedOutput: expectedOutput || "",
      testCases: Array.isArray(testCases) ? testCases : [],
      publicTests: Array.isArray(publicTests) ? publicTests : [],
      hiddenTests: Array.isArray(hiddenTests) ? hiddenTests : []
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