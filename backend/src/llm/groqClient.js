const Groq = require("groq-sdk");
const { GROQ_API_KEY, GROQ_MODEL } = require("../config/env");
const { sanitizeCode } = require("../utils/codeSanitizer");

const client = new Groq({
  apiKey: GROQ_API_KEY
});

/*
  Build language-specific instructions
*/
const getLanguageInstructions = (language) => {
  const normalizedLanguage = language?.toLowerCase();

  if (normalizedLanguage === "cpp") {
    return `
C++ requirements:
- Use #include <bits/stdc++.h> or standard headers
- Use cin for input
- Use cout for output
- Include int main()
- Do not hardcode sample input values
`;
  }

  if (normalizedLanguage === "javascript") {
    return `
JavaScript requirements:
- Read input using: const fs = require("fs");
- Use fs.readFileSync(0, "utf8") for stdin
- Print output using console.log
- Do not hardcode sample input values
`;
  }

  return `
General requirements:
- Read from standard input
- Write to standard output
- Do not hardcode sample values
`;
};

/*
  Generate code using Groq
*/
const generateCodeWithGroq = async ({ problem, language }) => {
  try {
    const languageInstructions = getLanguageInstructions(language);

    const systemPrompt = `
You are an expert competitive programmer.

Generate executable ${language} code that solves the user's problem.

Strict rules:
- Return ONLY raw code
- No explanations
- No markdown fences
- No hardcoded sample values
- Read input from standard input
- Print only the final required output
- The program must run directly from terminal

${languageInstructions}
`;

    const userPrompt = `
Problem:
${problem}

Generate the complete solution now.
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
    console.error("Groq generation error:", error);

    return `
/*
LLM generation failed

Error:
${error.message}
*/
`;
  }
};

module.exports = {
  generateCodeWithGroq
};