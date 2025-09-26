import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "https://prescripto-full-stack-1-9oce.onrender.com";

function Counter() {
  const location = useLocation();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);

  // Fetch all doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (location.state?.doctor) {
      setSelectedDoctor(location.state.doctor);
    }
  }, [location.state]);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/doctors/`);
      setDoctors(res.data.doctors);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchCount = async () => {
    if (!selectedDoctor) return;
    try {
      const res = await axios.get(`${API_BASE}/count/${encodeURIComponent(selectedDoctor.name)}`);
      setCount(res.data.waiting_count);
    } catch (err) {
      console.error("Error fetching count:", err);
      setMessage("❌ Error fetching count");
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      fetchCount();
      const interval = setInterval(fetchCount, 5000); // Reduced to 5 seconds to avoid rate limiting
      return () => clearInterval(interval);
    }
  }, [selectedDoctor]);

  // Capture image from webcam with better error handling
  const captureImage = async () => {
    try {
      const video = document.createElement("video");
      video.style.display = "none";
      video.setAttribute("playsinline", true);
      document.body.appendChild(video);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: "user" 
        } 
      });
      
      video.srcObject = stream;
      await video.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = () => {
          resolve();
        };
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/jpeg", 0.8); // Reduced quality for faster transmission
      
      // Cleanup
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(video);

      return imageData;
    } catch (error) {
      console.error("Error capturing image:", error);
      throw new Error("Failed to access camera. Please ensure camera permissions are granted.");
    }
  };

  const registerUser = async () => {
    if (!selectedDoctor) {
      setMessage("❌ Please select a doctor first");
      return;
    }
    
    setIsLoading(true);
    setMessage("");
    
    try {
      const imageData = await captureImage();
      const res = await axios.post(`${API_BASE}/register/`, {
        doctorName: selectedDoctor.name,
        image: imageData
      });
      setMessage(`✅ Registered with Dr. ${res.data.doctorName} (Waiting: ${res.data.waiting_count})`);
      fetchCount();
      fetchDoctors(); // Refresh doctors list
    } catch (err) {
      console.error("Error registering:", err);
      if (err.response?.data?.detail) {
        setMessage(`❌ ${err.response.data.detail}`);
      } else {
        setMessage("❌ Error registering user. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyUser = async () => {
    if (!selectedDoctor) {
      setMessage("❌ Please select a doctor first");
      return;
    }
    
    setIsLoading(true);
    setMessage("");
    
    try {
      const imageData = await captureImage();
      const res = await axios.post(`${API_BASE}/verify/`, {
        doctorName: selectedDoctor.name,
        image: imageData
      });
      
      if (res.data.status === "verified") {
        setMessage(`✅ User verified successfully! (Waiting: ${res.data.waiting_count})`);
      } else {
        setMessage(`❌ User not found in waiting list. (Waiting: ${res.data.waiting_count})`);
      }
      
      fetchCount();
      fetchDoctors(); // Refresh doctors list
    } catch (err) {
      console.error("Error verifying:", err);
      if (err.response?.data?.detail) {
        setMessage(`❌ ${err.response.data.detail}`);
      } else {
        setMessage("❌ Error verifying user. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setMessage(`👨‍⚕️ Selected Dr. ${doctor.name}`);
  };

  return (
    <div style={{ 
      textAlign: "center", 
      marginTop: "20px", 
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ color: "#2c3e50", marginBottom: "30px" }}>Digital Waiting Room</h1>
      
      {/* Doctor Selection */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Select a Doctor</h2>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px" }}>
          {doctors.map(doctor => (
            <button
              key={doctor.name}
              onClick={() => handleDoctorSelect(doctor)}
              style={{
                padding: "10px 20px",
                backgroundColor: selectedDoctor?.name === doctor.name ? "#3498db" : "#ecf0f1",
                color: selectedDoctor?.name === doctor.name ? "white" : "#2c3e50",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Dr. {doctor.name} ({doctor.waiting_count})
            </button>
          ))}
        </div>
      </div>

      {selectedDoctor && (
        <>
          <div style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px",
            border: "2px solid #e9ecef"
          }}>
            <h2 style={{ color: "#495057", margin: "0" }}>
              Doctor: {selectedDoctor.name}
            </h2>
            <h3 style={{ color: "#6c757d", margin: "10px 0 0 0" }}>
              Waiting Users: <span style={{ color: "#e74c3c", fontSize: "1.5em" }}>{count}</span>
            </h3>
          </div>

          {/* Action Buttons */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={registerUser}
              disabled={isLoading}
              style={{
                margin: "10px",
                padding: "12px 24px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "16px",
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? "⏳ Processing..." : "📷 Register Face"}
            </button>

            <button
              onClick={verifyUser}
              disabled={isLoading}
              style={{
                margin: "10px",
                padding: "12px 24px",
                backgroundColor: "#2980b9",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "16px",
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? "⏳ Processing..." : "🔍 Verify User"}
            </button>
          </div>
        </>
      )}

      {/* Message Display */}
      {message && (
        <div style={{
          padding: "15px",
          borderRadius: "5px",
          backgroundColor: message.includes("❌") ? "#f8d7da" : "#d1edff",
          color: message.includes("❌") ? "#721c24" : "#004085",
          border: `1px solid ${message.includes("❌") ? "#f5c6cb" : "#b8daff"}`,
          marginTop: "20px",
          fontSize: "16px"
        }}>
          {message}
        </div>
      )}

      {/* Instructions */}
      {!selectedDoctor && (
        <div style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "5px",
          color: "#856404"
        }}>
          <h3>How to use:</h3>
          <ol style={{ textAlign: "left", display: "inline-block" }}>
            <li>Select a doctor from the list above</li>
            <li>Click "Register Face" to add a new patient to the waiting list</li>
            <li>Click "Verify User" to check if a patient is in the waiting list</li>
            <li>The waiting count updates automatically every 5 seconds</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default Counter;