const { createPlan } = require("../agents/plannerAgent");
const { generateCode } = require("../agents/codeGeneratorAgent");
const { fixCodeWithLLM } = require("../agents/debugAgent");
const { saveCodeToFile } = require("../execution/fileManager");
const { executeCode } = require("../execution/codeExecutor");

/*
  Main service function

  Purpose:
  - Create plan
  - Generate code
  - Save code to file
  - Execute code with optional stdin
  - If execution fails, ask debug agent to fix it
  - Retry a few times
*/
const processProblem = async ({ problem, language, stdin = "" }) => {
  console.log("STEP 1: creating plan...");
  const plan = await createPlan({ problem, language });

  console.log("STEP 2: generating code...");
  const generatedCodeResult = await generateCode({ problem, plan });

  console.log("STEP 3: saving code to file...");
  let currentFile = await saveCodeToFile({
    code: generatedCodeResult.code,
    language: generatedCodeResult.language
  });

  console.log("Saved file:", currentFile.filePath);

  console.log("STEP 4: executing code...");
  let executionResult = await executeCode({
    filePath: currentFile.filePath,
    language: generatedCodeResult.language,
    stdin
  });

  console.log("Execution result:", executionResult);

  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (!executionResult.success && attempts < MAX_ATTEMPTS) {
    console.log(`DEBUG ATTEMPT ${attempts + 1}: fixing code...`);

    const fixedCode = await fixCodeWithLLM({
      code: generatedCodeResult.code,
      error: executionResult.error,
      language: generatedCodeResult.language
    });

    generatedCodeResult.code = fixedCode;

    console.log(`DEBUG ATTEMPT ${attempts + 1}: saving fixed code...`);
    currentFile = await saveCodeToFile({
      code: fixedCode,
      language: generatedCodeResult.language
    });

    console.log("Updated file:", currentFile.filePath);

    console.log(`DEBUG ATTEMPT ${attempts + 1}: executing fixed code...`);
    executionResult = await executeCode({
      filePath: currentFile.filePath,
      language: generatedCodeResult.language,
      stdin
    });

    console.log(`DEBUG ATTEMPT ${attempts + 1}: result`, executionResult);

    attempts++;
  }

  return {
    success: true,
    message: "Problem analyzed, code generated, and execution pipeline completed",
    data: {
      originalProblem: problem,
      plan,
      generatedCode: generatedCodeResult.code,
      language: generatedCodeResult.language,
      stdin,
      file: currentFile,
      execution: executionResult,
      debugAttempts: attempts,
      stage: "execution_completed"
    }
  };
};

module.exports = {
  processProblem
};