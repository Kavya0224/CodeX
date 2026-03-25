const Groq = require("groq-sdk");
const { GROQ_API_KEY, GROQ_MODEL } = require("../config/env");
const { sanitizeCode } = require("../utils/codeSanitizer");

const client = new Groq({
  apiKey: GROQ_API_KEY
});

/*
  Debug Agent

  Purpose:
  Fix code using richer debugging context.
*/
const fixCodeWithLLM = async ({
  problem,
  code,
  language,
  failureType = "",
  error = "",
  stdin = "",
  expectedOutput = "",
  actualOutput = ""
}) => {
  try {
    const systemPrompt = `
You are an expert competitive programmer and debugging assistant.

You will receive:
- a programming problem
- the current code
- failure details

Your task:
Fix the code so it works correctly.

Strict rules:
- Return ONLY corrected ${language} code
- No explanations
- No markdown fences
- Keep input from standard input
- Print only final required output
- Do not add prompts like "Enter number"
- Do not hardcode sample values
`;

    const userPrompt = `
Problem:
${problem}

Language:
${language}

Failure Type:
${failureType}

Current Code:
${code}

Runtime / Compiler Error:
${error || "N/A"}

Failing Input:
${stdin || "N/A"}

Expected Output:
${expectedOutput || "N/A"}

Actual Output:
${actualOutput || "N/A"}

Fix the program now.
`;

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1
    });

    const content = response?.choices?.[0]?.message?.content || "";

    return sanitizeCode(content);
  } catch (error) {
    console.error("Debug agent error:", error);
    return code;
  }
};

module.exports = {
  fixCodeWithLLM
};