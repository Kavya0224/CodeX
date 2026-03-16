/*
  Planner Agent

  Purpose:
  - Acts like the first reasoning layer of the system
  - Understands the problem at a basic level
  - Creates a rough execution plan before code generation

  Right now:
  - This is a mock planner using simple keyword checks
  - Later we will replace this with an LLM-based planner
*/

const createPlan = async ({ problem, language }) => {
  // Convert problem to lowercase so keyword checks become easier
  const normalizedProblem = problem.toLowerCase();

  // Default detected task type
  let taskType = "general_problem_solving";

  /*
    Very simple keyword-based task detection.
    This is NOT intelligent yet.
    It just helps us build the architecture step by step.
  */
  if (
    normalizedProblem.includes("add") ||
    normalizedProblem.includes("sum") ||
    normalizedProblem.includes("two numbers")
  ) {
    taskType = "basic_arithmetic";
  } else if (
    normalizedProblem.includes("sort") ||
    normalizedProblem.includes("array")
  ) {
    taskType = "array_manipulation";
  } else if (
    normalizedProblem.includes("string") ||
    normalizedProblem.includes("substring")
  ) {
    taskType = "string_processing";
  }

  /*
    Create a simple mock plan.
    Later this same structure can come from an LLM.
  */
  const plan = {
    taskType,
    selectedLanguage: language || "javascript",
    steps: [
      "Understand the problem statement",
      "Identify the required input and output",
      "Choose a suitable approach",
      "Generate code",
      "Run and validate the output"
    ],
    status: "plan_created"
  };

  return plan;
};

// Export the planner function
module.exports = {
  createPlan
};