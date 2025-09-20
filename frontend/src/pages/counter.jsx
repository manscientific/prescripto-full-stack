import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000"; // Make sure this matches your FastAPI port

function Counter() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch current waiting count
  const fetchCount = async () => {
    try {
      const res = await axios.get(`${API_BASE}/count/`);
      setCount(res.data.waiting_count);
    } catch (err) {
      console.error("Error fetching count:", err);
      setMessage("❌ Error fetching count");
    }
  };

  // Run fetch every 2 seconds
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const registerUser = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/register/`);
      setMessage(`✅ ${res.data.status} (Waiting: ${res.data.waiting_count})`);
      fetchCount();
    } catch (err) {
      console.error("Error registering:", err);
      setMessage("❌ Error registering user");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyUser = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/verify/`);
      setMessage(`✅ ${res.data.status} (Waiting: ${res.data.waiting_count})`);
      fetchCount();
    } catch (err) {
      console.error("Error verifying:", err);
      setMessage("❌ Error verifying user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>test site</h1>
      <h2>Waiting Users: {count}</h2>

      <button
        onClick={registerUser}
        disabled={isLoading}
        style={{ margin: "10px", padding: "10px" }}
      >
        {isLoading ? "Processing..." : "Register User"}
      </button>

      <button
        onClick={verifyUser}
        disabled={isLoading}
        style={{ margin: "10px", padding: "10px" }}
      >
        {isLoading ? "Processing..." : "Verify User"}
      </button>

      {/* Status / Error Messages */}
      <p style={{ marginTop: "20px", color: "blue" }}>{message}</p>
    </div>
  );
}

export default Counter;