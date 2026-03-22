/*
  Test Case Runner

  Purpose:
  Run generated code against multiple test cases and collect results.
*/

const { executeCode } = require("../execution/codeExecutor");
const { validateOutput } = require("./outputValidator");

/*
  Run all test cases on the same code file
*/
const runTestCases = async ({ filePath, language, testCases = [] }) => {
  const results = [];

  /*
    If no test cases were provided, return empty summary
  */
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      allPassed: true,
      results: [],
      message: "No test cases provided"
    };
  }

  for (let i = 0; i < testCases.length; i++) {
    const currentTestCase = testCases[i];
    const stdin = currentTestCase.stdin || "";
    const expectedOutput = currentTestCase.expectedOutput || "";

    // Execute program with this stdin
    const execution = await executeCode({
      filePath,
      language,
      stdin
    });

    // Validate result
    const validation = validateOutput({
      actualOutput: execution.output,
      expectedOutput
    });

    const passed = execution.success && (validation.checked ? validation.matched : true);

    results.push({
      index: i,
      stdin,
      expectedOutput,
      execution,
      validation,
      passed
    });
  }

  const passedCount = results.filter((item) => item.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    allPassed: failedCount === 0,
    results,
    message: failedCount === 0 ? "All test cases passed" : "Some test cases failed"
  };
};

module.exports = {
  runTestCases
};