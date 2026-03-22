/*
  Output Validator

  Purpose:
  Compare actual program output with expected output.
*/
const validateOutput = ({ actualOutput, expectedOutput }) => {
  // If expected output is not provided, skip validation
  if (expectedOutput === undefined || expectedOutput === null || expectedOutput === "") {
    return {
      checked: false,
      matched: null,
      message: "No expected output provided"
    };
  }

  const normalizedActual = String(actualOutput).trim();
  const normalizedExpected = String(expectedOutput).trim();

  const matched = normalizedActual === normalizedExpected;

  return {
    checked: true,
    matched,
    actualOutput: normalizedActual,
    expectedOutput: normalizedExpected,
    message: matched ? "Output matched expected output" : "Wrong answer"
  };
};

module.exports = {
  validateOutput
};