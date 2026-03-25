const { spawn } = require("child_process");
const path = require("path");
const { saveInputToFile, cleanupFiles } = require("./fileManager");

/*
  Execute generated code inside Docker sandbox
*/
const executeCode = async ({ filePath, language, stdin = "" }) => {
  const normalizedLanguage = language?.toLowerCase();

  if (!["javascript", "cpp"].includes(normalizedLanguage)) {
    return {
      success: false,
      output: "",
      error: `Execution for '${language}' is not supported right now. Please use javascript or cpp.`,
      status: "execution_not_supported"
    };
  }

  const inputFile = await saveInputToFile({ stdin });
  const workspaceDir = path.dirname(filePath);
  const codeFileName = path.basename(filePath);
  const inputFileName = path.basename(inputFile.inputFilePath);

  // Expected compiled binary path for cpp on host workspace
  const compiledBinaryPath =
    normalizedLanguage === "cpp"
      ? path.join(workspaceDir, `${path.parse(codeFileName).name}.exe`)
      : null;

  try {
    const result = await runInDocker({
      workspaceDir,
      language: normalizedLanguage,
      codeFileName,
      inputFileName
    });

    // Clean temporary input file and compiled binary after execution
    await cleanupFiles([
      inputFile.inputFilePath,
      compiledBinaryPath
    ]);

    return result;
  } catch (error) {
    await cleanupFiles([
      inputFile.inputFilePath,
      compiledBinaryPath
    ]);

    return {
      success: false,
      output: "",
      error: error.message,
      status: "execution_failed"
    };
  }
};

const runInDocker = ({ workspaceDir, language, codeFileName, inputFileName }) => {
  return new Promise((resolve) => {
    const dockerArgs = [
      "run",
      "--rm",
      "--network", "none",
      "--memory", "256m",
      "--cpus", "1",
      "-v", `${workspaceDir}:/app/workspace`,
      "ai-code-sandbox",
      language,
      `/app/workspace/${codeFileName}`,
      `/app/workspace/${inputFileName}`
    ];

    const child = spawn("docker", dockerArgs, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        child.kill();

        resolve({
          success: false,
          output: stdout.trim(),
          error: "Sandbox execution timed out",
          status: "execution_timeout"
        });
      }
    }, 10000);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      resolve({
        success: false,
        output: stdout.trim(),
        error: error.message,
        status: "execution_failed"
      });
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      if (code !== 0) {
        return resolve({
          success: false,
          output: stdout.trim(),
          error: stderr.trim() || `Sandbox exited with code ${code}`,
          status: "execution_failed"
        });
      }

      return resolve({
        success: true,
        output: stdout.trim(),
        error: "",
        status: "execution_success"
      });
    });
  });
};

module.exports = {
  executeCode
};