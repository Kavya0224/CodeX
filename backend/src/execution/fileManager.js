// Node's built-in file system module
const fs = require("fs");

// Node's path module helps build safe file paths
const path = require("path");

/*
  Helper function: decide file extension from selected language
*/
const getFileExtension = (language) => {
  const normalizedLanguage = language?.toLowerCase();

  if (normalizedLanguage === "javascript") return "js";
  if (normalizedLanguage === "cpp") return "cpp";
  if (normalizedLanguage === "python") return "py";

  // fallback extension for unsupported cases
  return "txt";
};

/*
  Helper function: create workspace folder if it does not exist
*/
const ensureWorkspaceExists = () => {
  const workspacePath = path.join(__dirname, "workspace");

  /*
    fs.existsSync checks whether the folder already exists.
    If not, fs.mkdirSync creates it.
  */
  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }

  return workspacePath;
};

/*
  Main function: save generated code into a file

  Purpose:
  - Create workspace if needed
  - Generate a unique filename
  - Write generated code into that file
  - Return file metadata
*/
const saveCodeToFile = async ({ code, language }) => {
  // Make sure the workspace directory exists
  const workspacePath = ensureWorkspaceExists();

  // Get correct extension based on selected language
  const extension = getFileExtension(language);

  /*
    Create a unique filename using timestamp.
    Example:
    solution_1712345678901.cpp
  */
  const fileName = `solution_${Date.now()}.${extension}`;

  // Build full absolute path
  const filePath = path.join(workspacePath, fileName);

  /*
    Write code to the file.
    fs.writeFileSync is enough for this phase.
    Later we can switch to async if needed.
  */
  fs.writeFileSync(filePath, code, "utf-8");

  return {
    fileName,
    filePath,
    extension,
    status: "file_saved"
  };
};

// Export function so service can use it
module.exports = {
  saveCodeToFile
};