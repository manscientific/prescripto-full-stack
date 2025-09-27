import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css"; // import styles

const API_BASE = "http://localhost:8000";

function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.doctor) setDoctor(location.state.doctor);
  }, [location.state]);

  const fetchCount = async () => {
    if (!doctor) return;
    try {
      const res = await axios.get(`${API_BASE}/count/${doctor.name}`);
      setCount(res.data.waiting_count);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching count");
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 2000);
    return () => clearInterval(interval);
  }, [doctor]);

  const registerUser = async () => {
    if (!doctor) return;
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_BASE}/register/`, {
        doctorName: doctor.name,
        doctorId: doctor._id,
      });

      if (res.data.status === "success") {
        setMessage(
          `✅ Successfully registered with Dr. ${res.data.doctorName} • Your waiting position: ${res.data.waiting_count}`
        );
        fetchCount();
      } else {
        setMessage(`❌ ${res.data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "❌ Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <header className="header">
          <h1 className="title">👤 Patient Registration</h1>
          <div className="divider"></div>
        </header>

        {doctor && (
          <div className="doctor-section">
            <div className="doctor-info">
              <h2 className="doctor-label">Registering with</h2>
              <div className="doctor-badge">
                <span className="doctor-name">Dr. {doctor.name}</span>
              </div>
            </div>
          </div>
        )}

        <div className="counter-section">
          <div className="counter-container">
            <h3 className="counter-label">Current Waiting Patients</h3>
            <div className="counter-display">
              <span className="counter-number">{count}</span>
            </div>
            <p className="counter-subtext">Updates every 2 seconds</p>
          </div>
        </div>

        <div className="registration-section">
          <div className="instructions">
            <h3 className="instructions-title">Registration Process</h3>
            <ul className="instructions-list">
              <li>📸 Face recognition registration</li>
              <li>⚡ Quick and secure process</li>
              <li>📱 Real-time queue updates</li>
              <li>🔔 Notifications when ready</li>
            </ul>
          </div>

          <button
            onClick={registerUser}
            disabled={isLoading || !doctor}
            className={`register-btn ${
              isLoading || !doctor ? "disabled" : ""
            }`}
          >
            {isLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                Processing Registration...
              </div>
            ) : (
              "📸 Register with Face Recognition"
            )}
          </button>
        </div>

        {message && (
          <div
            className={
              message.includes("❌") ? "error-message" : "success-message"
            }
          >
            <p className="message-text">{message}</p>
          </div>
        )}

        <div className="navigation-section">
          <button onClick={() => navigate("/")} className="back-btn">
            ← Back to Waiting Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
