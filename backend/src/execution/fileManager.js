const fs = require("fs");
const path = require("path");

const getFileExtension = (language) => {
  const normalizedLanguage = language?.toLowerCase();

  if (normalizedLanguage === "javascript") return "js";
  if (normalizedLanguage === "cpp") return "cpp";

  return "txt";
};

const ensureWorkspaceExists = () => {
  const workspacePath = path.resolve(__dirname, "../../workspace");

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }

  return workspacePath;
};

const saveCodeToFile = async ({ code, language }) => {
  const workspacePath = ensureWorkspaceExists();
  const extension = getFileExtension(language);

  const fileName = `solution_${Date.now()}.${extension}`;
  const filePath = path.join(workspacePath, fileName);

  fs.writeFileSync(filePath, code, "utf-8");

  return {
    fileName,
    filePath,
    extension,
    status: "file_saved"
  };
};

const saveInputToFile = async ({ stdin = "" }) => {
  const workspacePath = ensureWorkspaceExists();

  const inputFileName = `input_${Date.now()}.txt`;
  const inputFilePath = path.join(workspacePath, inputFileName);

  fs.writeFileSync(inputFilePath, stdin, "utf-8");

  return {
    inputFileName,
    inputFilePath,
    status: "input_saved"
  };
};

/*
  Delete a single file safely
*/
const deleteFileIfExists = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Failed to delete file:", filePath, error.message);
  }
};

/*
  Delete multiple files safely
*/
const cleanupFiles = async (filePaths = []) => {
  for (const filePath of filePaths) {
    await deleteFileIfExists(filePath);
  }
};

/*
  Optional helper:
  remove old files from workspace if they are older than given age
*/
const cleanupOldWorkspaceFiles = async ({ maxAgeMs = 60 * 60 * 1000 } = {}) => {
  try {
    const workspacePath = ensureWorkspaceExists();
    const files = fs.readdirSync(workspacePath);
    const now = Date.now();

    for (const fileName of files) {
      const fullPath = path.join(workspacePath, fileName);

      try {
        const stats = fs.statSync(fullPath);
        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error("Failed while cleaning old workspace file:", fullPath, error.message);
      }
    }
  } catch (error) {
    console.error("Workspace cleanup error:", error.message);
  }
};

module.exports = {
  saveCodeToFile,
  saveInputToFile,
  deleteFileIfExists,
  cleanupFiles,
  cleanupOldWorkspaceFiles
};