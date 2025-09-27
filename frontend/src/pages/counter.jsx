import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8000";

function Counter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (location.state?.doctor) {
      setSelectedDoctor(location.state.doctor);
    }
  }, [location.state]);

  const fetchCount = async () => {
    if (!selectedDoctor) return;
    try {
      const res = await axios.get(`${API_BASE}/count/${selectedDoctor.name}`);
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
  }, [selectedDoctor]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Digital Waiting Room</h1>
      {selectedDoctor && <h2>Doctor: {selectedDoctor.name}</h2>}
      <h2>Waiting Users: {count}</h2>

      <button
        onClick={() =>
          navigate("/register", { state: { doctor: selectedDoctor } })
        }
        style={{ margin: "10px", padding: "10px" }}
      >
        Go to Register
      </button>

     <button
  onClick={() =>
    navigate("/doctor-login", { state: { doctor: selectedDoctor } })
  }
  style={{ margin: "10px", padding: "10px" }}
>
  Go to Verify (Doctor Only)
</button>


      <p style={{ marginTop: "20px", color: "blue" }}>{message}</p>
    </div>
  );
}

export default Counter;
