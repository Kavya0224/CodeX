const { explainCode } = require("../services/explainService");

const explainProblemCode = async (req, res) => {
  try {
    const { problem, language, code } = req.body;

    if (!problem || !problem.trim()) {
      return res.status(400).json({
        success: false,
        message: "Problem statement is required"
      });
    }

    if (!language || !language.trim()) {
      return res.status(400).json({
        success: false,
        message: "Language is required"
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code is required"
      });
    }

    const result = await explainCode({ problem, language, code });

    return res.status(200).json(result);
  } catch (error) {
    console.error("EXPLAIN CONTROLLER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while explaining the code",
      error: error.message
    });
  }
};

module.exports = {
  explainProblemCode
};