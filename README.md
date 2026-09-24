# CodeX 🤖

**AI-powered coding assistant that generates code, debugs it automatically, and explains its logic — end to end.**

CodeX takes a plain-English problem statement, runs it through a lightweight multi-agent pipeline (plan → generate → execute → debug), and returns working, tested code along with a plain-language explanation. Code execution happens inside an isolated Docker sandbox, and failed runs are automatically fed back to an LLM debugging agent for self-correction.

🔗 **Live demo:** [code-x-umber-kappa.vercel.app](https://code-x-umber-kappa.vercel.app)

---

## ✨ Features

- **Problem → Code generation** — describe a problem in natural language and get working C++ or JavaScript code back.
- **Agent pipeline** — a Planner Agent scopes the task, a Code Generator Agent produces the solution, and a Debug Agent automatically repairs failing code.
- **Sandboxed execution** — generated code runs inside a locked-down Docker container (`--network none`, memory/CPU limits, execution timeout) rather than on the host machine.
- **Self-healing retries** — if execution fails or output doesn't match expectations, the pipeline automatically retries with LLM-driven fixes, up to a configurable attempt limit.
- **Test case support** — run against a single stdin/expected-output pair, a batch of test cases, or separate public/hidden test suites (judge-style).
- **Code explanation mode** — get a structured breakdown of any solution: problem understanding, approach, code walkthrough, time complexity, and space complexity.
- **Execution telemetry** — every run produces structured logs and stage-by-stage performance metrics (planning, generation, execution, validation, debug durations).
- **React frontend** — a clean UI for submitting problems, viewing generated code with syntax highlighting, and browsing run history (persisted locally).

---

## 🏗️ Architecture

```
frontend (React + Vite)
   │  POST /solve, /explain
   ▼
backend (Express)
   │
   ├── Planner Agent      → produces a rough execution plan
   ├── Code Generator      → calls Groq LLM to generate code
   ├── Code Executor       → runs code in an isolated Docker sandbox
   ├── Output Validator     → compares actual vs expected output
   ├── Test Case Runner     → runs single / batch / public+hidden tests
   └── Debug Agent         → sends failures back to the LLM to auto-fix code
```

The `/solve` pipeline loops through **generate → execute → validate → debug** until the code passes (or a retry limit is reached), tracking every attempt, log entry, and timing metric along the way.

---

## 🧰 Tech Stack

**Backend**
- Node.js + Express
- [Groq SDK](https://www.npmjs.com/package/groq-sdk) (default model: `llama-3.3-70b-versatile`)
- Docker (sandboxed code execution — supports JavaScript and C++)
- CORS, dotenv

**Frontend**
- React 19 + Vite
- `react-syntax-highlighter` for code display
- Local storage for run history

---

## 📁 Project Structure

```
CodeX/
├── backend/
│   ├── sandbox/
│   │   ├── Dockerfile        # ubuntu-based sandbox image (g++, node)
│   │   └── runner.sh         # executes JS/C++ inside the container
│   └── src/
│       ├── agents/           # planner, code generator, debug agents
│       ├── config/           # env config
│       ├── controllers/      # solve / explain request handlers
│       ├── execution/        # code execution + file management
│       ├── llm/              # Groq client wrapper
│       ├── routes/           # /solve, /explain routes
│       ├── services/         # core solve/explain orchestration
│       ├── utils/            # sanitizer, validator, logger, test runner, perf tracker
│       └── server.js
└── frontend/
    └── src/
        ├── App.jsx           # main UI
        └── ...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Docker (required for code execution — the sandbox runs as a container named `ai-code-sandbox`)
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repo
```bash
git clone https://github.com/Kavya0224/CodeX.git
cd CodeX
```

### 2. Build the sandbox image
```bash
cd backend/sandbox
docker build -t ai-code-sandbox .
cd ..
```

### 3. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Run the backend:
```bash
npm run dev     # with nodemon
# or
npm start
```

### 4. Set up the frontend
```bash
cd ../frontend
npm install
```

Optionally set the API URL (defaults to `http://localhost:5000`):
```env
VITE_API_URL=http://localhost:5000
```

Run the frontend:
```bash
npm run dev
```

---

## 🔌 API Reference

### `POST /solve`
Generates, executes, validates, and (if needed) auto-debugs code for a given problem.

```json
{
  "problem": "Add two numbers",
  "language": "cpp",
  "stdin": "3 5",
  "expectedOutput": "8"
}
```

Also supports `testCases` (array) or separate `publicTests` / `hiddenTests` arrays for judge-style evaluation. Returns the generated code, execution result, verdict (`Accepted`, `Wrong Answer`, `Failed Test Cases`, `Environment Error`, etc.), retry/debug history, and detailed stage metrics.

### `POST /explain`
Returns a structured explanation of a piece of code.

```json
{
  "problem": "Add two numbers",
  "language": "cpp",
  "code": "..."
}
```

### `GET /health`
Simple health check endpoint.

---

## ⚠️ Notes

- Code execution currently supports **JavaScript** and **C++** only.
- The sandbox enforces a 10-second execution timeout, 256MB memory limit, and disables network access for safety.
- This project is under active development — the Planner Agent currently uses simple keyword-based heuristics and is expected to move to a full LLM-based planner.

---

## 📄 License

No license specified yet — add one (e.g. MIT) if you intend for others to use or contribute to this project.
