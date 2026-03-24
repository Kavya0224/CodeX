import { useState } from "react";

function App() {
  const [problem, setProblem] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [stdin, setStdin] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("http://localhost:5000/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          problem,
          language,
          stdin,
          expectedOutput
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      <h1>AI Coding Agent 🚀</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Enter problem..."
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={5}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="cpp">C++</option>
          <option value="javascript">JavaScript</option>
        </select>

        <textarea
          placeholder="stdin"
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={2}
          style={{ width: "100%", marginTop: 10 }}
        />

        <textarea
          placeholder="expected output"
          value={expectedOutput}
          onChange={(e) => setExpectedOutput(e.target.value)}
          rows={2}
          style={{ width: "100%", marginTop: 10 }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Running..." : "Solve"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {response && (
        <div style={{ marginTop: 20 }}>
          <h2>Verdict: {response.data.verdict}</h2>

          <h3>Code</h3>
          <pre>{response.data.generatedCode}</pre>

          <h3>Output</h3>
          <pre>{response.data.execution?.output}</pre>

          <h3>Logs</h3>
          <pre>{JSON.stringify(response.data.logs, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;