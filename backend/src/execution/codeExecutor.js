const { spawn } = require("child_process");
const path = require("path");

/*
  Execute generated code file

  Supported languages:
  - JavaScript
  - C++
*/
const executeCode = async ({ filePath, language, stdin = "" }) => {
  const normalizedLanguage = language?.toLowerCase();

  if (normalizedLanguage === "javascript") {
    return runJavaScript(filePath, stdin);
  }

  if (normalizedLanguage === "cpp") {
    return runCpp(filePath, stdin);
  }

  return {
    success: false,
    output: "",
    error: `Execution for '${language}' is not supported right now. Please use javascript or cpp.`,
    status: "execution_not_supported"
  };
};

/*
  Generic helper to run a process with stdin
*/
const runProcess = (command, args = [], stdin = "", timeoutMs = 5000) => {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"]
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
          error: "Process timed out",
          status: "execution_timeout"
        });
      }
    }, timeoutMs);

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
          error: stderr.trim() || `Process exited with code ${code}`,
          status: "execution_failed"
        });
      }

      if (stderr.trim() !== "") {
        return resolve({
          success: false,
          output: stdout.trim(),
          error: stderr.trim(),
          status: "execution_stderr"
        });
      }

      return resolve({
        success: true,
        output: stdout.trim(),
        error: "",
        status: "execution_success"
      });
    });

    // Pass input to the child process
    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
};

/*
  Run JavaScript file using Node.js
*/
const runJavaScript = async (filePath, stdin) => {
  return runProcess(process.execPath, [filePath], stdin, 5000);
};

/*
  Compile and run C++ file
*/
const runCpp = async (filePath, stdin) => {
  return new Promise((resolve) => {
    const parsedPath = path.parse(filePath);
    const outputFilePath = path.join(parsedPath.dir, `${parsedPath.name}.exe`);

    // Step 1: compile
    const compiler = spawn("g++", [filePath, "-o", outputFilePath], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let compileStdout = "";
    let compileStderr = "";

    compiler.stdout.on("data", (data) => {
      compileStdout += data.toString();
    });

    compiler.stderr.on("data", (data) => {
      compileStderr += data.toString();
    });

    compiler.on("error", (error) => {
      return resolve({
        success: false,
        output: compileStdout.trim(),
        error: error.message,
        status: "compilation_failed"
      });
    });

    compiler.on("close", async (code) => {
      if (code !== 0) {
        return resolve({
          success: false,
          output: compileStdout.trim(),
          error: compileStderr.trim() || `Compilation failed with code ${code}`,
          status: "compilation_failed"
        });
      }

      // Step 2: run compiled executable
      const runResult = await runProcess(outputFilePath, [], stdin, 5000);
      resolve(runResult);
    });
  });
};

module.exports = {
  executeCode
};