import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8000";

function Register() {
  const location = useLocation();
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
    try {
      const res = await axios.post(`${API_BASE}/register/`, {
        doctorName: doctor.name,
        doctorId: doctor._id,
      });

      if (res.data.status === "success") {
        setMessage(
          `✅ Registered with Dr. ${res.data.doctorName} (Waiting: ${res.data.waiting_count})`
        );
        fetchCount();
      } else {
        setMessage(`❌ ${res.data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "❌ Error registering");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Register for Dr. {doctor?.name}</h1>
      <h2>Current Waiting Users: {count}</h2>
      <button
        onClick={registerUser}
        disabled={isLoading || !doctor}
        style={{ margin: "10px", padding: "10px" }}
      >
        {isLoading ? "Processing..." : "Register Face"}
      </button>
      <p style={{ marginTop: "20px", color: "blue" }}>{message}</p>
    </div>
  );
}

export default Register;
