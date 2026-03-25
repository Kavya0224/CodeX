import { useState } from "react";

function App() {
  const [problem, setProblem] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [stdin, setStdin] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("code");

  // Explanation state
  const [explanation, setExplanation] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse(null);
    setExplanation("");
    setExplainError("");

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

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      setResponse(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      const codeText = String(result?.generatedCode || "")
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\r\n/g, "\n");

      await navigator.clipboard.writeText(codeText);
      alert("Code copied successfully!");
    } catch (err) {
      alert("Failed to copy code.");
    }
  };

  const handleClear = () => {
    setProblem("");
    setLanguage("cpp");
    setStdin("");
    setExpectedOutput("");
    setResponse(null);
    setError("");
    setExplanation("");
    setExplainError("");
    setActiveTab("code");
  };

  const handleExplainCode = async () => {
    if (!result?.generatedCode) return;

    setExplainLoading(true);
    setExplainError("");
    setExplanation("");

    try {
      const res = await fetch("http://localhost:5000/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          problem,
          language,
          code: result.generatedCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to explain code");
      }

      setExplanation(data?.data?.explanation || "No explanation returned.");
      setActiveTab("explain");
    } catch (err) {
      setExplainError(err.message || "Failed to explain code.");
    } finally {
      setExplainLoading(false);
    }
  };

  const result = response?.data;

  const tabs = [
    { key: "code", label: "Code" },
    { key: "output", label: "Output" },
    { key: "logs", label: "Logs" },
    { key: "metrics", label: "Metrics" },
    { key: "attempts", label: "Attempts" },
    { key: "explain", label: "Explain" }
  ];

  return (
    <div style={styles.page}>
      <div style={styles.bgCircle1}></div>
      <div style={styles.bgCircle2}></div>
      <div style={styles.bgCircle3}></div>

      <div style={styles.container}>
        <div style={styles.heroCard}>
          <div>
            <div style={styles.badge}>AI Coding Agent</div>
            <h1 style={styles.heading}>CodeX</h1>
            <p style={styles.subheading}>
              Generate, execute, validate, debug, and explain code from natural language problems.
            </p>
          </div>
        </div>

        <div style={styles.grid}>
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <h2 style={styles.cardTitle}>Problem Input</h2>

            <label style={styles.label}>Problem Statement</label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Write a C++ program that reads two numbers and prints their sum."
              rows={7}
              style={styles.textarea}
              required
            />

            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={styles.select}
                >
                  <option value="cpp">C++</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.label}>Expected Output</label>
                <textarea
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  placeholder="15"
                  rows={2}
                  style={styles.textareaSmall}
                />
              </div>
            </div>

            <label style={styles.label}>Standard Input</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="7 8"
              rows={4}
              style={styles.textarea}
            />

            <div style={styles.buttonRow}>
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? "Running Agent..." : "Solve Problem"}
              </button>

              <button
                type="button"
                onClick={handleClear}
                style={styles.clearButton}
              >
                Clear
              </button>
            </div>

            {error && (
              <div style={styles.errorCard}>
                <strong>Error:</strong> {error}
              </div>
            )}
          </form>

          <div style={styles.sidePanel}>
            <div style={styles.verdictCard}>
              <div style={styles.verdictHeader}>Final Verdict</div>
              <div
                style={{
                  ...styles.verdictValue,
                  color:
                    result?.verdict === "Accepted"
                      ? "#22c55e"
                      : result?.verdict === "Wrong Answer"
                      ? "#ef4444"
                      : result?.verdict === "Environment Error"
                      ? "#f59e0b"
                      : "#a78bfa"
                }}
              >
                {result?.verdict || "Waiting..."}
              </div>
              <div style={styles.verdictSub}>
                {result ? "Response received from backend" : "Submit a problem to begin"}
              </div>
            </div>

            <div style={styles.miniInfoCard}>
              <div style={styles.infoTitle}>Quick Info</div>
              <div style={styles.infoRow}>
                <span>Language</span>
                <span>{result?.language || language}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Debug Attempts</span>
                <span>{result?.debugAttempts ?? 0}</span>
              </div>
              <div style={styles.infoRow}>
                <span>Status</span>
                <span>{result?.execution?.status || "N/A"}</span>
              </div>
            </div>

            <div style={styles.miniInfoCard}>
              <div style={styles.infoTitle}>Metrics Snapshot</div>
              <div style={styles.infoRow}>
                <span>Total Time</span>
                <span>{result?.metrics?.totalDurationMs ?? 0} ms</span>
              </div>
              <div style={styles.infoRow}>
                <span>Generation</span>
                <span>{result?.metrics?.generationDurationMs ?? 0} ms</span>
              </div>
              <div style={styles.infoRow}>
                <span>Execution</span>
                <span>{result?.metrics?.executionDurationMs ?? 0} ms</span>
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div style={styles.resultsCard}>
            <div style={styles.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === tab.key ? styles.activeTabButton : {})
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "code" && (
              <div style={styles.contentCard}>
                <div style={styles.codeHeader}>
                  <h3 style={styles.sectionTitle}>Generated Code</h3>
                  <div style={styles.codeButtonGroup}>
                    <button onClick={handleCopyCode} style={styles.copyButton}>
                      Copy Code
                    </button>
                    <button
                      onClick={handleExplainCode}
                      style={styles.explainButton}
                      disabled={explainLoading}
                    >
                      {explainLoading ? "Explaining..." : "Explain Code"}
                    </button>
                  </div>
                </div>

                <pre
                  style={{
                    background: "#0f172a",
                    color: "#dbeafe",
                    borderRadius: "16px",
                    padding: "18px",
                    fontSize: "13px",
                    margin: 0,
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6
                  }}
                >
                  {String(result.generatedCode || "")
                    .replace(/\\r\\n/g, "\n")
                    .replace(/\\n/g, "\n")
                    .replace(/\r\n/g, "\n")}
                </pre>
              </div>
            )}

            {activeTab === "output" && (
              <div style={styles.contentCard}>
                <h3 style={styles.sectionTitle}>Execution Output</h3>
                <div style={styles.outputGrid}>
                  <div style={styles.outputBox}>
                    <div style={styles.outputLabel}>Status</div>
                    <div style={styles.outputValue}>{result.execution?.status || "N/A"}</div>
                  </div>
                  <div style={styles.outputBox}>
                    <div style={styles.outputLabel}>Output</div>
                    <div style={styles.outputValue}>{result.execution?.output || "N/A"}</div>
                  </div>
                  <div style={styles.outputBox}>
                    <div style={styles.outputLabel}>Error</div>
                    <div style={styles.outputValue}>{result.execution?.error || "None"}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div style={styles.contentCard}>
                <h3 style={styles.sectionTitle}>Execution Logs</h3>
                <pre style={styles.pre}>{JSON.stringify(result.logs || [], null, 2)}</pre>
              </div>
            )}

            {activeTab === "metrics" && (
              <div style={styles.contentCard}>
                <h3 style={styles.sectionTitle}>Performance Metrics</h3>
                <pre style={styles.pre}>{JSON.stringify(result.metrics || {}, null, 2)}</pre>
              </div>
            )}

            {activeTab === "attempts" && (
              <div style={styles.contentCard}>
                <h3 style={styles.sectionTitle}>Attempt History</h3>
                <pre style={styles.pre}>{JSON.stringify(result.attemptHistory || [], null, 2)}</pre>
              </div>
            )}

            {activeTab === "explain" && (
              <div style={styles.contentCard}>
                <h3 style={styles.sectionTitle}>Code Explanation</h3>

                {explainError && (
                  <div style={styles.errorCard}>
                    <strong>Error:</strong> {explainError}
                  </div>
                )}

                {explanation ? (
                  <pre style={styles.pre}>{explanation}</pre>
                ) : (
                  <div style={styles.emptyExplain}>
                    Click <strong>Explain Code</strong> in the Code tab to generate an explanation.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 55%, #0f766e 100%)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "28px 16px",
    color: "#fff"
  },
  bgCircle1: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(255, 0, 128, 0.18)",
    top: "-80px",
    left: "-60px",
    filter: "blur(20px)"
  },
  bgCircle2: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "rgba(0, 224, 255, 0.12)",
    top: "120px",
    right: "-100px",
    filter: "blur(30px)"
  },
  bgCircle3: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    background: "rgba(168, 85, 247, 0.15)",
    bottom: "-60px",
    left: "35%",
    filter: "blur(25px)"
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2
  },
  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    padding: "24px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  badge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #f472b6, #60a5fa)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "14px",
    letterSpacing: "0.5px"
  },
  heading: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1.1
  },
  subheading: {
    marginTop: "12px",
    marginBottom: 0,
    maxWidth: "620px",
    color: "rgba(255,255,255,0.86)",
    fontSize: "16px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.8fr",
    gap: "20px",
    alignItems: "start"
  },
  formCard: {
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "22px"
  },
  label: {
    fontWeight: "700",
    color: "#f8fafc"
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(15,23,42,0.45)",
    color: "#fff",
    padding: "14px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical"
  },
  textareaSmall: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(15,23,42,0.45)",
    color: "#fff",
    padding: "14px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    minHeight: "76px"
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(15,23,42,0.45)",
    color: "#fff",
    padding: "14px",
    fontSize: "14px",
    outline: "none"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "8px"
  },
  button: {
    flex: 1,
    border: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "15px",
    fontWeight: "700",
    color: "#fff",
    cursor: "pointer",
    background: "linear-gradient(90deg, #ec4899, #8b5cf6, #06b6d4)",
    boxShadow: "0 10px 24px rgba(139,92,246,0.32)"
  },
  clearButton: {
    border: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    fontSize: "15px",
    fontWeight: "700",
    color: "#fff",
    cursor: "pointer",
    background: "rgba(255,255,255,0.14)"
  },
  errorCard: {
    marginTop: "10px",
    borderRadius: "16px",
    padding: "14px",
    background: "rgba(239,68,68,0.2)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff"
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  verdictCard: {
    borderRadius: "24px",
    padding: "22px",
    background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.22)"
  },
  verdictHeader: {
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "rgba(255,255,255,0.74)",
    marginBottom: "12px"
  },
  verdictValue: {
    fontSize: "30px",
    fontWeight: "800",
    marginBottom: "8px"
  },
  verdictSub: {
    color: "rgba(255,255,255,0.76)",
    fontSize: "14px"
  },
  miniInfoCard: {
    borderRadius: "20px",
    padding: "18px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.16)"
  },
  infoTitle: {
    fontWeight: "700",
    marginBottom: "12px",
    fontSize: "18px"
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)"
  },
  resultsCard: {
    marginTop: "24px",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
    borderRadius: "24px",
    padding: "24px"
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px"
  },
  tabButton: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700"
  },
  activeTabButton: {
    background: "linear-gradient(90deg, #22c55e, #06b6d4)",
    color: "#fff",
    boxShadow: "0 8px 18px rgba(6,182,212,0.25)"
  },
  contentCard: {
    background: "rgba(15,23,42,0.35)",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "14px"
  },
  codeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap"
  },
  codeButtonGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  copyButton: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    background: "linear-gradient(90deg, #22c55e, #06b6d4)",
    color: "#fff"
  },
  explainButton: {
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    background: "linear-gradient(90deg, #f59e0b, #ef4444)",
    color: "#fff"
  },
  pre: {
    background: "#0f172a",
    color: "#dbeafe",
    borderRadius: "16px",
    padding: "16px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "13px",
    lineHeight: 1.5
  },
  outputGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "14px"
  },
  outputBox: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  outputLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: "rgba(255,255,255,0.72)",
    marginBottom: "8px"
  },
  outputValue: {
    fontWeight: "700",
    fontSize: "15px",
    color: "#fff"
  },
  emptyExplain: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "16px",
    color: "rgba(255,255,255,0.82)"
  }
};

export default App;