import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function DoctorLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const doctor = location.state?.doctor; // pass doctor when navigating

  const handleLogin = (e) => {
    e.preventDefault();

    // Simple password check (you can replace with backend validation)
    if (password === "doctor123") {
      // Navigate to verify page if correct
      navigate("/verify", { state: { doctor } });
    } else {
      setError("❌ Invalid password. Access denied.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Doctor Login</h1>
      <h2>Access Verification Page for Dr. {doctor?.name}</h2>
      <form onSubmit={handleLogin}>
        <input
          type="password"
          placeholder="Enter doctor password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ margin: "10px", padding: "10px" }}
        />
        <br />
        <button type="submit" style={{ padding: "10px" }}>
          Login
        </button>
      </form>
      {error && <p style={{ marginTop: "20px", color: "red" }}>{error}</p>}
    </div>
  );
}

export default DoctorLogin;
