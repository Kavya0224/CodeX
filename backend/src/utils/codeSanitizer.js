/*
  Code Sanitizer

  Purpose:
  Clean LLM responses before saving them to file.
*/
const sanitizeCode = (rawText) => {
  if (!rawText) return "";

  let code = rawText.trim();

  // Remove markdown code fences
  code = code.replace(/^```[a-zA-Z0-9]*\n?/, "");
  code = code.replace(/\n?```$/, "");

  // Remove common extra prefixes
  code = code.replace(/^Here(?:'s| is) .*?:\n/i, "");
  code = code.replace(/^Sure.*?:\n/i, "");
  code = code.replace(/^Below is .*?:\n/i, "");

  return code.trim();
};

module.exports = {
  sanitizeCode
};