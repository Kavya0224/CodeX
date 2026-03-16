const Groq = require("groq-sdk");
const { GROQ_API_KEY, GROQ_MODEL } = require("../config/env");
const { sanitizeCode } = require("../utils/codeSanitizer");

const client = new Groq({
  apiKey: GROQ_API_KEY
});

/*
Debug Agent

Purpose:
Fix code when compilation or runtime errors occur.
*/
const fixCodeWithLLM = async ({ code, error, language }) => {
  try {

    const systemPrompt = `
You are an expert software engineer.

You will receive:
1) A program
2) An error message

Your job:
Fix the program so it runs correctly.

Rules:
- Return ONLY corrected ${language} code
- No explanations
- No markdown
`;

    const userPrompt = `
Code:
${code}

Error:
${error}

Fix the program.
`;

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
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