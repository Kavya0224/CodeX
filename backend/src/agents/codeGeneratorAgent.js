const { generateCodeWithGroq } = require("../llm/groqClient");

/*
  Code Generator Agent

  Purpose:
  - Ask Groq to generate code for the given problem
  - Return the generated code in a structured format
*/
const generateCode = async ({ problem, plan }) => {
  const language = plan.selectedLanguage?.toLowerCase() || "javascript";

  const generatedCode = await generateCodeWithGroq({
    problem,
    language
  });

  return {
    problem,
    language,
    code: generatedCode,
    status: "code_generated"
  };
};

module.exports = {
  generateCode
};