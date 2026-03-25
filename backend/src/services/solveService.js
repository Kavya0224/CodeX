const { createPlan } = require("../agents/plannerAgent");
const { generateCode } = require("../agents/codeGeneratorAgent");
const { fixCodeWithLLM } = require("../agents/debugAgent");
const { saveCodeToFile } = require("../execution/fileManager");
const { executeCode } = require("../execution/codeExecutor");
const { validateOutput } = require("../utils/outputValidator");
const { runTestCases } = require("../utils/testCaseRunner");
const { createLogEntry, pushLog } = require("../utils/executionLogger");
const { startTimer, endTimer } = require("../utils/performanceTracker");

const isEnvironmentError = (errorMessage = "") => {
  const msg = String(errorMessage).toLowerCase();

  return (
    msg.includes("failed to connect to the docker api") ||
    msg.includes("dockerdesktoplinuxengine") ||
    msg.includes("daemon is running") ||
    msg.includes("the system cannot find the file specified") ||
    msg.includes("docker") ||
    msg.includes("sandbox")
  );
};

const processProblem = async ({
  problem,
  language,
  stdin = "",
  expectedOutput = "",
  testCases = [],
  publicTests = [],
  hiddenTests = []
}) => {
  const logs = [];
  const attemptHistory = [];

  const metrics = {
    totalDurationMs: 0,
    planningDurationMs: 0,
    generationDurationMs: 0,
    fileSaveDurationMs: 0,
    executionDurationMs: 0,
    validationDurationMs: 0,
    testRunDurationMs: 0,
    debugDurationMs: 0
  };

  const totalStart = startTimer();

  pushLog(
    logs,
    createLogEntry({
      stage: "request_received",
      status: "success",
      message: "Request received by solve service",
      metadata: {
        language,
        hasStdin: Boolean(stdin),
        testCasesCount: testCases.length,
        publicTestsCount: publicTests.length,
        hiddenTestsCount: hiddenTests.length
      }
    })
  );

  const hasCombinedTests = Array.isArray(testCases) && testCases.length > 0;
  const hasJudgeTests =
    (Array.isArray(publicTests) && publicTests.length > 0) ||
    (Array.isArray(hiddenTests) && hiddenTests.length > 0);

  // Planning
  pushLog(
    logs,
    createLogEntry({
      stage: "planning",
      status: "started",
      message: "Creating problem-solving plan"
    })
  );

  const planningStart = startTimer();
  const plan = await createPlan({ problem, language });
  metrics.planningDurationMs = endTimer(planningStart);

  pushLog(
    logs,
    createLogEntry({
      stage: "planning",
      status: "success",
      message: "Plan created successfully",
      metadata: {
        taskType: plan.taskType,
        selectedLanguage: plan.selectedLanguage,
        durationMs: metrics.planningDurationMs
      }
    })
  );

  // Generation
  pushLog(
    logs,
    createLogEntry({
      stage: "generation",
      status: "started",
      message: "Generating code with LLM"
    })
  );

  const generationStart = startTimer();
  const generatedCodeResult = await generateCode({ problem, plan });
  metrics.generationDurationMs = endTimer(generationStart);

  pushLog(
    logs,
    createLogEntry({
      stage: "generation",
      status: "success",
      message: "Code generated successfully",
      metadata: {
        language: generatedCodeResult.language,
        codeLength: generatedCodeResult.code.length,
        durationMs: metrics.generationDurationMs
      }
    })
  );

  // Save file
  pushLog(
    logs,
    createLogEntry({
      stage: "file_save",
      status: "started",
      message: "Saving generated code to file"
    })
  );

  const fileSaveStart = startTimer();
  let currentFile = await saveCodeToFile({
    code: generatedCodeResult.code,
    language: generatedCodeResult.language
  });
  metrics.fileSaveDurationMs = endTimer(fileSaveStart);

  pushLog(
    logs,
    createLogEntry({
      stage: "file_save",
      status: "success",
      message: "Code file saved successfully",
      metadata: {
        filePath: currentFile.filePath,
        durationMs: metrics.fileSaveDurationMs
      }
    })
  );

  let executionResult = null;
  let validationResult = null;
  let testRunSummary = null;
  let publicResults = null;
  let hiddenResults = null;

  // Initial run
  if (hasJudgeTests) {
    const testRunStart = startTimer();

    if (publicTests.length > 0) {
      pushLog(
        logs,
        createLogEntry({
          stage: "public_tests",
          status: "started",
          message: "Running public tests"
        })
      );

      publicResults = await runTestCases({
        filePath: currentFile.filePath,
        language: generatedCodeResult.language,
        testCases: publicTests
      });

      pushLog(
        logs,
        createLogEntry({
          stage: "public_tests",
          status: publicResults.allPassed ? "success" : "failed",
          message: publicResults.message,
          metadata: {
            total: publicResults.total,
            passed: publicResults.passed,
            failed: publicResults.failed
          }
        })
      );
    }

    if (hiddenTests.length > 0) {
      pushLog(
        logs,
        createLogEntry({
          stage: "hidden_tests",
          status: "started",
          message: "Running hidden tests"
        })
      );

      hiddenResults = await runTestCases({
        filePath: currentFile.filePath,
        language: generatedCodeResult.language,
        testCases: hiddenTests
      });

      pushLog(
        logs,
        createLogEntry({
          stage: "hidden_tests",
          status: hiddenResults.allPassed ? "success" : "failed",
          message: hiddenResults.message,
          metadata: {
            total: hiddenResults.total,
            passed: hiddenResults.passed,
            failed: hiddenResults.failed
          }
        })
      );
    }

    metrics.testRunDurationMs += endTimer(testRunStart);

    attemptHistory.push({
      attempt: 0,
      code: generatedCodeResult.code,
      filePath: currentFile.filePath,
      publicResults,
      hiddenResults
    });
  } else if (hasCombinedTests) {
    pushLog(
      logs,
      createLogEntry({
        stage: "multi_test_run",
        status: "started",
        message: "Running multiple test cases"
      })
    );

    const testRunStart = startTimer();
    testRunSummary = await runTestCases({
      filePath: currentFile.filePath,
      language: generatedCodeResult.language,
      testCases
    });
    metrics.testRunDurationMs += endTimer(testRunStart);

    pushLog(
      logs,
      createLogEntry({
        stage: "multi_test_run",
        status: testRunSummary.allPassed ? "success" : "failed",
        message: testRunSummary.message,
        metadata: {
          total: testRunSummary.total,
          passed: testRunSummary.passed,
          failed: testRunSummary.failed,
          durationMs: metrics.testRunDurationMs
        }
      })
    );

    attemptHistory.push({
      attempt: 0,
      code: generatedCodeResult.code,
      filePath: currentFile.filePath,
      testRunSummary
    });
  } else {
    pushLog(
      logs,
      createLogEntry({
        stage: "execution",
        status: "started",
        message: "Executing single input"
      })
    );

    const executionStart = startTimer();
    executionResult = await executeCode({
      filePath: currentFile.filePath,
      language: generatedCodeResult.language,
      stdin
    });
    metrics.executionDurationMs += endTimer(executionStart);

    pushLog(
      logs,
      createLogEntry({
        stage: "execution",
        status: executionResult.success ? "success" : "failed",
        message: executionResult.success
          ? "Execution completed successfully"
          : "Execution failed",
        metadata: {
          status: executionResult.status,
          error: executionResult.error,
          durationMs: metrics.executionDurationMs
        }
      })
    );

    const validationStart = startTimer();
    validationResult = validateOutput({
      actualOutput: executionResult.output,
      expectedOutput
    });
    metrics.validationDurationMs += endTimer(validationStart);

    pushLog(
      logs,
      createLogEntry({
        stage: "validation",
        status:
          validationResult.checked === false
            ? "skipped"
            : validationResult.matched
            ? "success"
            : "failed",
        message: validationResult.message,
        metadata: {
          actualOutput: validationResult.actualOutput,
          expectedOutput: validationResult.expectedOutput,
          durationMs: metrics.validationDurationMs
        }
      })
    );

    attemptHistory.push({
      attempt: 0,
      code: generatedCodeResult.code,
      filePath: currentFile.filePath,
      execution: executionResult,
      validation: validationResult
    });
  }

  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (attempts < MAX_ATTEMPTS) {
    let shouldRetry = false;
    let debugReason = "";
    let failingInput = "";
    let failingExpectedOutput = "";
    let failingActualOutput = "";
    let failureType = "";

    if (hasJudgeTests) {
      if (publicResults && !publicResults.allPassed) {
        const firstFailedCase = publicResults.results.find((item) => !item.passed);
        if (firstFailedCase) {
          failingInput = firstFailedCase.stdin || "";
          failingExpectedOutput =
            firstFailedCase.validation?.expectedOutput ||
            firstFailedCase.expectedOutput ||
            "";
          failingActualOutput =
            firstFailedCase.validation?.actualOutput ||
            firstFailedCase.execution?.output ||
            "";

          if (!firstFailedCase.execution.success) {
            failureType = "execution_failure";
            if (isEnvironmentError(firstFailedCase.execution.error)) {
              shouldRetry = false;
            } else {
              shouldRetry = true;
              debugReason = firstFailedCase.execution.error;
            }
          } else {
            failureType = "wrong_answer";
            shouldRetry = true;
            debugReason = `Wrong answer on public test. Input: ${failingInput}. Expected: ${failingExpectedOutput}. Got: ${failingActualOutput}`;
          }
        }
      } else if (hiddenResults && !hiddenResults.allPassed) {
        const firstFailedCase = hiddenResults.results.find((item) => !item.passed);
        if (firstFailedCase) {
          failingInput = firstFailedCase.stdin || "";
          failingExpectedOutput =
            firstFailedCase.validation?.expectedOutput ||
            firstFailedCase.expectedOutput ||
            "";
          failingActualOutput =
            firstFailedCase.validation?.actualOutput ||
            firstFailedCase.execution?.output ||
            "";

          if (!firstFailedCase.execution.success) {
            failureType = "execution_failure";
            if (isEnvironmentError(firstFailedCase.execution.error)) {
              shouldRetry = false;
            } else {
              shouldRetry = true;
              debugReason = firstFailedCase.execution.error;
            }
          } else {
            failureType = "wrong_answer";
            shouldRetry = true;
            debugReason = `Wrong answer on hidden test. Input: ${failingInput}. Expected: ${failingExpectedOutput}. Got: ${failingActualOutput}`;
          }
        }
      }
    } else if (hasCombinedTests) {
      if (!testRunSummary.allPassed) {
        const firstFailedCase = testRunSummary.results.find((item) => !item.passed);
        if (firstFailedCase) {
          failingInput = firstFailedCase.stdin || "";
          failingExpectedOutput =
            firstFailedCase.validation?.expectedOutput ||
            firstFailedCase.expectedOutput ||
            "";
          failingActualOutput =
            firstFailedCase.validation?.actualOutput ||
            firstFailedCase.execution?.output ||
            "";

          if (!firstFailedCase.execution.success) {
            failureType = "execution_failure";
            if (isEnvironmentError(firstFailedCase.execution.error)) {
              shouldRetry = false;
            } else {
              shouldRetry = true;
              debugReason = firstFailedCase.execution.error;
            }
          } else {
            failureType = "wrong_answer";
            shouldRetry = true;
            debugReason = `Wrong answer on test case. Input: ${failingInput}. Expected: ${failingExpectedOutput}. Got: ${failingActualOutput}`;
          }
        }
      }
    } else {
      if (!executionResult.success) {
        failingInput = stdin;
        failingExpectedOutput = expectedOutput;
        failingActualOutput = executionResult.output || "";
        failureType = "execution_failure";

        if (isEnvironmentError(executionResult.error)) {
          shouldRetry = false;
        } else {
          shouldRetry = true;
          debugReason = executionResult.error;
        }
      } else if (validationResult.checked && validationResult.matched === false) {
        failingInput = stdin;
        failingExpectedOutput = validationResult.expectedOutput || expectedOutput;
        failingActualOutput = validationResult.actualOutput || executionResult.output || "";
        failureType = "wrong_answer";
        shouldRetry = true;
        debugReason = `Wrong answer. Expected: ${failingExpectedOutput}, Got: ${failingActualOutput}`;
      }
    }

    if (!shouldRetry) break;

    pushLog(
      logs,
      createLogEntry({
        stage: "debug_retry",
        status: "started",
        message: `Starting debug attempt ${attempts + 1}`,
        metadata: {
          failureType,
          debugReason,
          failingInput,
          failingExpectedOutput,
          failingActualOutput
        }
      })
    );

    const debugStart = startTimer();
    const fixedCode = await fixCodeWithLLM({
      problem,
      code: generatedCodeResult.code,
      language: generatedCodeResult.language,
      failureType,
      error: debugReason,
      stdin: failingInput,
      expectedOutput: failingExpectedOutput,
      actualOutput: failingActualOutput
    });
    metrics.debugDurationMs += endTimer(debugStart);

    generatedCodeResult.code = fixedCode;

    const retryFileSaveStart = startTimer();
    currentFile = await saveCodeToFile({
      code: fixedCode,
      language: generatedCodeResult.language
    });
    metrics.fileSaveDurationMs += endTimer(retryFileSaveStart);

    pushLog(
      logs,
      createLogEntry({
        stage: "debug_retry",
        status: "success",
        message: `Generated fixed code for attempt ${attempts + 1}`,
        metadata: {
          filePath: currentFile.filePath,
          debugDurationMs: metrics.debugDurationMs
        }
      })
    );

    if (hasJudgeTests) {
      const judgeRetryStart = startTimer();

      if (publicTests.length > 0) {
        publicResults = await runTestCases({
          filePath: currentFile.filePath,
          language: generatedCodeResult.language,
          testCases: publicTests
        });
      }

      if (hiddenTests.length > 0) {
        hiddenResults = await runTestCases({
          filePath: currentFile.filePath,
          language: generatedCodeResult.language,
          testCases: hiddenTests
        });
      }

      metrics.testRunDurationMs += endTimer(judgeRetryStart);

      attemptHistory.push({
        attempt: attempts + 1,
        code: fixedCode,
        filePath: currentFile.filePath,
        debugReason,
        failureType,
        failingInput,
        failingExpectedOutput,
        failingActualOutput,
        publicResults,
        hiddenResults
      });
    } else if (hasCombinedTests) {
      const multiRetryStart = startTimer();
      testRunSummary = await runTestCases({
        filePath: currentFile.filePath,
        language: generatedCodeResult.language,
        testCases
      });
      metrics.testRunDurationMs += endTimer(multiRetryStart);

      attemptHistory.push({
        attempt: attempts + 1,
        code: fixedCode,
        filePath: currentFile.filePath,
        debugReason,
        failureType,
        failingInput,
        failingExpectedOutput,
        failingActualOutput,
        testRunSummary
      });
    } else {
      const retryExecStart = startTimer();
      executionResult = await executeCode({
        filePath: currentFile.filePath,
        language: generatedCodeResult.language,
        stdin
      });
      metrics.executionDurationMs += endTimer(retryExecStart);

      const retryValidationStart = startTimer();
      validationResult = validateOutput({
        actualOutput: executionResult.output,
        expectedOutput
      });
      metrics.validationDurationMs += endTimer(retryValidationStart);

      attemptHistory.push({
        attempt: attempts + 1,
        code: fixedCode,
        filePath: currentFile.filePath,
        debugReason,
        failureType,
        failingInput,
        failingExpectedOutput,
        failingActualOutput,
        execution: executionResult,
        validation: validationResult
      });
    }

    attempts++;
  }

  let verdict = "Accepted";

  if (hasJudgeTests) {
    const publicEnvError =
      publicResults?.results?.find(
        (item) => !item.execution.success && isEnvironmentError(item.execution.error)
      );

    const hiddenEnvError =
      hiddenResults?.results?.find(
        (item) => !item.execution.success && isEnvironmentError(item.execution.error)
      );

    if (publicEnvError || hiddenEnvError) {
      verdict = "Environment Error";
    } else if (publicResults && !publicResults.allPassed) {
      verdict = "Failed Public Tests";
    } else if (hiddenResults && !hiddenResults.allPassed) {
      verdict = "Failed Hidden Tests";
    }
  } else if (hasCombinedTests) {
    const envErrorCase =
      testRunSummary?.results?.find(
        (item) => !item.execution.success && isEnvironmentError(item.execution.error)
      );

    if (envErrorCase) {
      verdict = "Environment Error";
    } else {
      verdict = testRunSummary.allPassed ? "Accepted" : "Failed Test Cases";
    }
  } else {
    if (!executionResult.success) {
      verdict = isEnvironmentError(executionResult.error)
        ? "Environment Error"
        : "Execution Failed";
    } else if (validationResult.checked && validationResult.matched === false) {
      verdict = "Wrong Answer";
    }
  }

  metrics.totalDurationMs = endTimer(totalStart);

  pushLog(
    logs,
    createLogEntry({
      stage: "final_verdict",
      status: "success",
      message: "Pipeline completed",
      metadata: {
        verdict,
        debugAttempts: attempts,
        totalDurationMs: metrics.totalDurationMs
      }
    })
  );

  return {
    success: true,
    message: "Problem analyzed, code generated, and execution pipeline completed",
    data: {
      originalProblem: problem,
      plan,
      generatedCode: generatedCodeResult.code,
      language: generatedCodeResult.language,
      stdin,
      expectedOutput,
      testCases,
      publicTests,
      file: currentFile,
      execution: executionResult,
      validation: validationResult,
      testRunSummary,
      publicResults,
      verdict,
      debugAttempts: attempts,
      attemptHistory,
      metrics,
      logs,
      stage: "execution_completed"
    }
  };
};

module.exports = {
  processProblem
};