import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8000";

function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);

  useEffect(() => {
    if (location.state?.doctor) {
      setDoctor(location.state.doctor);
    } else {
      navigate("/doctor-login");
    }
  }, [location.state, navigate]);

  const fetchCount = async () => {
    if (!doctor) return;
    try {
      const res = await axios.get(`${API_BASE}/count/${doctor.name}`);
      setCount(res.data.waiting_count);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching patient count");
    }
  };

  useEffect(() => {
    if (doctor) {
      fetchCount();
      const interval = setInterval(fetchCount, 2000);
      return () => clearInterval(interval);
    }
  }, [doctor]);

  const verifyUser = async () => {
    if (!doctor) return;
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_BASE}/verify/`, {
        doctorName: doctor.name,
      });
      
      const newMessage = `✅ ${res.data.status} • Waiting patients: ${res.data.waiting_count}`;
      setMessage(newMessage);
      
      // Add to verification history
      setVerificationHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        message: newMessage,
        status: "success"
      }, ...prev.slice(0, 4)]); // Keep last 5 entries
      
      fetchCount();
    } catch (err) {
      console.error(err);
      const errorMessage = "❌ Verification failed. No patients in queue or system error.";
      setMessage(errorMessage);
      
      setVerificationHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        message: errorMessage,
        status: "error"
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setVerificationHistory([]);
    setMessage("");
  };

  if (!doctor) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Redirecting to doctor login...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🔒 Doctor Verification Panel</h1>
            <button 
              onClick={() => navigate("/")}
              style={styles.homeButton}
            >
              🏠 Home
            </button>
          </div>
          <div style={styles.divider}></div>
        </header>

        <div style={styles.doctorSection}>
          <div style={styles.doctorCard}>
            <div style={styles.doctorAvatar}>👨‍⚕️</div>
            <div style={styles.doctorInfo}>
              <h2 style={styles.doctorLabel}>Verified Doctor</h2>
              <div style={styles.doctorBadge}>
                <span style={styles.doctorName}>Dr. {doctor.name}</span>
              </div>
              <p style={styles.doctorStatus}>🟢 Currently On Duty</p>
            </div>
          </div>
        </div>

        <div style={styles.statsSection}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏱️</div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Waiting Patients</h3>
              <div style={styles.statValue}>{count}</div>
              <p style={styles.statSubtext}>In queue</p>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Verified Today</h3>
              <div style={styles.statValue}>{verificationHistory.filter(v => v.status === "success").length}</div>
              <p style={styles.statSubtext}>Patients</p>
            </div>
          </div>
        </div>

        <div style={styles.verificationSection}>
          <div style={styles.verificationHeader}>
            <h3 style={styles.verificationTitle}>Patient Verification</h3>
            <p style={styles.verificationSubtitle}>
              Verify the next patient in queue using face recognition
            </p>
          </div>

          <button
            onClick={verifyUser}
            disabled={isLoading || count === 0}
            style={
              isLoading || count === 0 
                ? { ...styles.verifyButton, ...styles.verifyButtonDisabled }
                : styles.verifyButton
            }
          >
            {isLoading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.buttonSpinner}></div>
                Verifying Patient...
              </div>
            ) : count === 0 ? (
              "⏸️ No Patients in Queue"
            ) : (
              "🔍 Verify Next Patient"
            )}
          </button>

          {count === 0 && (
            <div style={styles.emptyQueueMessage}>
              <p>📭 Queue is empty. No patients waiting for verification.</p>
            </div>
          )}
        </div>

        {message && (
          <div style={message.includes("❌") ? styles.errorMessage : styles.successMessage}>
            <p style={styles.messageText}>
              {message.includes("✅") ? "✅ " : "❌ "}
              {message.replace("✅ ", "").replace("❌ ", "")}
            </p>
          </div>
        )}

        {verificationHistory.length > 0 && (
          <div style={styles.historySection}>
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>📋 Recent Verifications</h3>
              <button onClick={clearHistory} style={styles.clearButton}>
                🗑️ Clear
              </button>
            </div>
            <div style={styles.historyList}>
              {verificationHistory.map((item) => (
                <div key={item.id} style={
                  item.status === "success" ? styles.historyItemSuccess : styles.historyItemError
                }>
                  <div style={styles.historyTime}>{item.timestamp}</div>
                  <div style={styles.historyMessage}>{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            💡 <strong>Tip:</strong> Verify patients one by one as they enter your office
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
    maxWidth: "800px",
    width: "100%",
    textAlign: "center"
  },
  header: {
    marginBottom: "30px"
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px"
  },
  title: {
    fontSize: "2.3rem",
    fontWeight: "700",
    color: "#1a365d",
    margin: "0",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  homeButton: {
    background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem"
  },
  divider: {
    height: "4px",
    background: "linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)",
    borderRadius: "2px",
    width: "120px",
    margin: "0 auto"
  },
  doctorSection: {
    marginBottom: "30px"
  },
  doctorCard: {
    display: "flex",
    alignItems: "center",
    background: "#f0f7ff",
    padding: "25px",
    borderRadius: "15px",
    border: "2px solid #c3dafe",
    gap: "20px"
  },
  doctorAvatar: {
    fontSize: "3rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
  },
  doctorInfo: {
    textAlign: "left",
    flex: 1
  },
  doctorLabel: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#4a5568",
    margin: "0 0 8px 0"
  },
  doctorBadge: {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "20px",
    fontSize: "1.4rem",
    fontWeight: "700",
    display: "inline-block",
    marginBottom: "8px"
  },
  doctorStatus: {
    fontSize: "0.9rem",
    color: "#48bb78",
    fontWeight: "600",
    margin: "0"
  },
  statsSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px"
  },
  statCard: {
    background: "linear-gradient(135deg, #fed7e2 0%, #fbb6ce 100%)",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    border: "2px solid #f687b3"
  },
  statIcon: {
    fontSize: "2rem"
  },
  statContent: {
    textAlign: "left",
    flex: 1
  },
  statLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#702459",
    margin: "0 0 5px 0"
  },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: "800",
    color: "#702459",
    lineHeight: "1"
  },
  statSubtext: {
    fontSize: "0.8rem",
    color: "#702459",
    opacity: "0.8",
    margin: "5px 0 0 0"
  },
  verificationSection: {
    marginBottom: "25px",
    padding: "25px",
    background: "#f7fafc",
    borderRadius: "15px",
    border: "1px solid #e2e8f0"
  },
  verificationHeader: {
    marginBottom: "20px"
  },
  verificationTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 10px 0"
  },
  verificationSubtitle: {
    fontSize: "1rem",
    color: "#718096",
    margin: "0"
  },
  verifyButton: {
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    color: "white",
    border: "none",
    padding: "20px 30px",
    fontSize: "1.3rem",
    fontWeight: "600",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(30, 60, 114, 0.4)",
    width: "100%",
    minHeight: "70px"
  },
  verifyButtonDisabled: {
    background: "linear-gradient(135deg, #a0aec0 0%, #718096 100%)",
    cursor: "not-allowed",
    boxShadow: "none",
    opacity: "0.7"
  },
  emptyQueueMessage: {
    background: "#fffaf0",
    border: "2px solid #fbd38d",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "15px"
  },
  successMessage: {
    background: "#f0fff4",
    border: "2px solid #9ae6b4",
    borderRadius: "12px",
    padding: "20px",
    margin: "20px 0"
  },
  errorMessage: {
    background: "#fed7d7",
    border: "2px solid #feb2b2",
    borderRadius: "12px",
    padding: "20px",
    margin: "20px 0"
  },
  messageText: {
    fontSize: "1.1rem",
    fontWeight: "600",
    margin: "0",
    lineHeight: "1.5"
  },
  historySection: {
    marginBottom: "20px"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px"
  },
  historyTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0"
  },
  clearButton: {
    background: "#fed7d7",
    border: "1px solid #feb2b2",
    color: "#c53030",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.8rem"
  },
  historyList: {
    maxHeight: "200px",
    overflowY: "auto"
  },
  historyItemSuccess: {
    background: "#f0fff4",
    border: "1px solid #9ae6b4",
    borderRadius: "8px",
    padding: "10px 15px",
    margin: "5px 0",
    textAlign: "left"
  },
  historyItemError: {
    background: "#fed7d7",
    border: "1px solid #feb2b2",
    borderRadius: "8px",
    padding: "10px 15px",
    margin: "5px 0",
    textAlign: "left"
  },
  historyTime: {
    fontSize: "0.8rem",
    color: "#718096",
    fontWeight: "600",
    marginBottom: "3px"
  },
  historyMessage: {
    fontSize: "0.9rem",
    fontWeight: "500",
    margin: "0"
  },
  footer: {
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px solid #e2e8f0"
  },
  footerText: {
    fontSize: "0.9rem",
    color: "#718096",
    margin: "0",
    fontStyle: "italic"
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #1e3c72",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "50px auto"
  },
  buttonSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #ffffff",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    fontSize: "1.1rem",
    color: "#4a5568",
    marginTop: "10px"
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// Add hover effects
setTimeout(() => {
  const verifyButton = document.querySelector(`button[style*="${styles.verifyButton.background}"]`);
  const homeButton = document.querySelector(`button[style*="${styles.homeButton.background}"]`);
  
  if (verifyButton && !verifyButton.disabled) {
    verifyButton.onmouseenter = () => {
      verifyButton.style.transform = "translateY(-2px)";
      verifyButton.style.boxShadow = "0 10px 30px rgba(30, 60, 114, 0.6)";
    };
    verifyButton.onmouseleave = () => {
      verifyButton.style.transform = "translateY(0)";
      verifyButton.style.boxShadow = styles.verifyButton.boxShadow;
    };
  }
  
  if (homeButton) {
    homeButton.onmouseenter = () => {
      homeButton.style.transform = "translateY(-1px)";
      homeButton.style.boxShadow = "0 4px 15px rgba(72, 187, 120, 0.4)";
    };
    homeButton.onmouseleave = () => {
      homeButton.style.transform = "translateY(0)";
      homeButton.style.boxShadow = "none";
    };
  }
}, 100);

export default Verify;