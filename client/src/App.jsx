import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api/problems";

// Helper to convert problem name to URL slug
const createSlug = (text) => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

// Helper to generate correct direct platform problem links
const getPlatformUrl = (platform, problemInput) => {
  const slug = createSlug(problemInput);
  if (platform === "LeetCode") {
    // return `https://leetcode.com/problems/${problemInput}/`;
    return "https://www.google.com/search?q=leetcode+problem+" + problemInput;
  }
  return (
    "https://www.google.com/search?q=geeksforgeeks+problem+" + problemInput
  );
};

function App() {
  const [problems, setProblems] = useState([]);
  const [problemId, setProblemId] = useState("");
  const [platform, setPlatform] = useState("LeetCode");

  // Weekend Modal States
  const [dueProblems, setDueProblems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Fetch all problems
    fetch(API_BASE)
      .then((res) => res.json())
      .then((data) => setProblems(data))
      .catch((err) => console.error("Error fetching problems:", err));

    // 2. Check if today is a weekend (0 = Sunday, 6 = Saturday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      fetch(`${API_BASE}/due`)
        .then((res) => res.json())
        .then((dueData) => {
          if (dueData && dueData.length > 0) {
            setDueProblems(dueData);
            setShowModal(true);
          }
        })
        .catch((err) => console.error("Error fetching due problems:", err));
    }
  }, []);

  // Add new question
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problemId.trim()) return;

    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problemId.trim(), platform }),
      });

      const newProblem = await response.json();
      setProblems((prev) => [newProblem, ...prev]);
      setProblemId("");
    } catch (err) {
      console.error("Error adding problem:", err);
    }
  };

  // ACTION 1: Mark as Solved -> Deletes from Backend DB
  const handleSolved = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });

      // Remove from main list
      setProblems((prev) => prev.filter((p) => p._id !== id));

      // Remove from weekend modal list
      const remainingDue = dueProblems.filter((p) => p._id !== id);
      setDueProblems(remainingDue);

      if (remainingDue.length === 0) {
        setShowModal(false);
      }
    } catch (err) {
      console.error("Error deleting problem:", err);
    }
  };

  // ACTION 2: Re-attempt -> Recalculates Revision Date (+14 days weekend)
  const handleReattempt = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}/reattempt`, {
        method: "PATCH",
      });
      const updated = await response.json();

      // Update in main list
      setProblems((prev) => prev.map((p) => (p._id === id ? updated : p)));

      // Remove from weekend modal list (rescheduled to future)
      const remainingDue = dueProblems.filter((p) => p._id !== id);
      setDueProblems(remainingDue);

      if (remainingDue.length === 0) {
        setShowModal(false);
      }
    } catch (err) {
      console.error("Error re-attempting problem:", err);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.cardContainer}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>DSA Revision Tracker</h1>
          <p style={styles.subtitle}>
            Track solved questions and upsolve them on weekends.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Problem Name (e.g. Valid Palindrome)"
            value={problemId}
            onChange={(e) => setProblemId(e.target.value)}
            required
            style={styles.input}
          />

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            style={styles.select}
          >
            <option value="LeetCode">LeetCode</option>
            <option value="GFG">GFG</option>
          </select>

          <button type="submit" style={styles.button}>
            Add Question
          </button>
        </form>

        {/* Problem List */}
        <div style={styles.listSection}>
          <h2 style={styles.sectionTitle}>
            Tracked Questions ({problems.length})
          </h2>

          {problems.length === 0 ? (
            <p style={styles.emptyText}>
              No questions tracked yet. Add your first problem above!
            </p>
          ) : (
            <ul style={styles.list}>
              {problems.map((prob) => (
                <li key={prob._id} style={styles.listItem}>
                  <div style={styles.itemInfo}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          prob.platform === "LeetCode" ? "#281A0B" : "#0A1C11",
                        color:
                          prob.platform === "LeetCode" ? "#F97316" : "#22C55E",
                        borderColor:
                          prob.platform === "LeetCode" ? "#43260A" : "#10301B",
                      }}
                    >
                      {prob.platform}
                    </span>

                    <div>
                      <a
                        href={getPlatformUrl(prob.platform, prob.problemId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.problemLink}
                      >
                        {prob.problemId} ↗
                      </a>
                      <br />
                      <small style={styles.dateText}>
                        Next Revision:{" "}
                        {new Date(prob.revisionDate).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={styles.actionGroup}>
                    <button
                      onClick={() => handleReattempt(prob._id)}
                      style={styles.reattemptBtn}
                      title="Reschedule revision for 2 weeks out"
                    >
                      Re-attempt
                    </button>
                    <button
                      onClick={() => handleSolved(prob._id)}
                      style={styles.solvedBtn}
                      title="Delete problem permanently"
                    >
                      Solved
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Weekend Pop-up Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚡ Weekend Revision Due</h3>
              <p style={styles.modalSubtitle}>
                Select an action for your due problems today:
              </p>
            </div>

            <ul style={styles.modalList}>
              {dueProblems.map((prob) => (
                <li key={prob._id} style={styles.modalItem}>
                  <div style={styles.itemInfo}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          prob.platform === "LeetCode" ? "#281A0B" : "#0A1C11",
                        color:
                          prob.platform === "LeetCode" ? "#F97316" : "#22C55E",
                        borderColor:
                          prob.platform === "LeetCode" ? "#43260A" : "#10301B",
                      }}
                    >
                      {prob.platform}
                    </span>
                    <a
                      href={getPlatformUrl(prob.platform, prob.problemId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.problemLink}
                    >
                      {prob.problemId}
                    </a>
                  </div>

                  <div style={styles.actionGroup}>
                    <button
                      onClick={() => handleReattempt(prob._id)}
                      style={styles.reattemptBtn}
                    >
                      Re-attempt
                    </button>
                    <button
                      onClick={() => handleSolved(prob._id)}
                      style={styles.solvedBtn}
                    >
                      Solved
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles - DARK THEME
const styles = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "#111827",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#F9FAFB",
  },
  cardContainer: {
    width: "100%",
    maxWidth: "720px",
    backgroundColor: "#1F2937",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    padding: "40px",
    height: "fit-content",
    border: "1px solid #374151",
  },
  header: {
    marginBottom: "32px",
    textAlign: "center",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#F9FAFB",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#9CA3AF",
    margin: 0,
  },
  form: {
    display: "flex",
    gap: "12px",
    marginBottom: "40px",
    flexWrap: "wrap",
    padding: "20px",
    backgroundColor: "#111827",
    borderRadius: "12px",
    border: "1px solid #374151",
  },
  input: {
    flex: "1 1 260px",
    padding: "12px 16px",
    fontSize: "15px",
    borderRadius: "10px",
    border: "1px solid #4B5563",
    outline: "none",
    backgroundColor: "#1F2937",
    color: "#F9FAFB",
  },
  select: {
    padding: "12px 16px",
    fontSize: "15px",
    borderRadius: "10px",
    border: "1px solid #4B5563",
    backgroundColor: "#1F2937",
    color: "#F9FAFB",
    cursor: "pointer",
  },
  button: {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#FFFFFF",
    backgroundColor: "#4F46E5",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  listSection: {
    borderTop: "1px solid #374151",
    paddingTop: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#E5E7EB",
    marginBottom: "20px",
  },
  emptyText: {
    fontSize: "15px",
    color: "#6B7280",
    textAlign: "center",
    padding: "30px 0",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid #374151",
    backgroundColor: "#111827",
  },
  itemInfo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  badge: {
    fontSize: "12px",
    fontWeight: "700",
    padding: "5px 10px",
    borderRadius: "8px",
    border: "1px solid",
    textTransform: "uppercase",
  },
  problemLink: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#F9FAFB",
    textDecoration: "none",
  },
  dateText: {
    color: "#6B7280",
    fontSize: "12px",
  },
  actionGroup: {
    display: "flex",
    gap: "8px",
  },
  reattemptBtn: {
    backgroundColor: "#374151",
    color: "#60A5FA",
    border: "1px solid #4B5563",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  solvedBtn: {
    backgroundColor: "#15803D",
    color: "#FFFFFF",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#1F2937",
    padding: "32px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
    border: "1px solid #4B5563",
  },
  modalHeader: {
    marginBottom: "24px",
    textAlign: "center",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#F9FAFB",
    margin: "0 0 6px 0",
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: 0,
  },
  modalList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 24px 0",
    maxHeight: "300px",
    overflowY: "auto",
  },
  modalItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #374151",
  },
  closeBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#374151",
    border: "none",
    borderRadius: "10px",
    color: "#E5E7EB",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
  },
};

export default App;
