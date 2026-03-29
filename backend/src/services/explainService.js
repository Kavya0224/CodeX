const { generateExplanationWithGroq } = require("../llm/groqClient");

const explainCode = async ({ problem, language, code }) => {
  const explanation = await generateExplanationWithGroq({
    problem,
    language,
    code
  });

  return {
    success: true,
    message: "Code explanation generated successfully",
    data: {
      problem,
      language,
      code,
      explanation
    }
  };
};

module.exports = {
  explainCode
};