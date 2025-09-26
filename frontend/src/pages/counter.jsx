import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

function Counter() {
  const location = useLocation();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      console.error("Error fetching count:", err);
      setMessage("❌ Error fetching count");
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 2000);
    return () => clearInterval(interval);
  }, [selectedDoctor]);

  // Capture image from webcam
  const captureImage = async () => {
    const video = document.createElement("video");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");

    stream.getTracks().forEach(track => track.stop()); // stop camera
    return imageData;
  };

  const registerUser = async () => {
    if (!selectedDoctor) return;
    setIsLoading(true);
    try {
      const imageData = await captureImage();
      const res = await axios.post(`${API_BASE}/register/`, {
        doctorName: selectedDoctor?.name,
        doctorId: selectedDoctor?._id,
        image: imageData
      });

      setMessage(
        `✅ Registered with Dr. ${res.data.doctorName} (Waiting: ${res.data.waiting_count})`
      );
      fetchCount();
    } catch (err) {
      console.error("Error registering:", err);
      setMessage("❌ Error registering user");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyUser = async () => {
    if (!selectedDoctor) return;
    setIsLoading(true);
    try {
      const imageData = await captureImage();
      const res = await axios.post(`${API_BASE}/verify/`, {
        doctorName: selectedDoctor?.name,
        image: imageData
      });

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
      <h1>Digital Waiting Room</h1>
      {selectedDoctor && <h2>Doctor: {selectedDoctor.name}</h2>}
      <h2>Waiting Users: {count}</h2>

      <button
        onClick={registerUser}
        disabled={isLoading || !selectedDoctor}
        style={{ margin: "10px", padding: "10px" }}
      >
        {isLoading ? "Processing..." : "Register Face"}
      </button>

      <button
        onClick={verifyUser}
        disabled={isLoading || !selectedDoctor}
        style={{ margin: "10px", padding: "10px" }}
      >
        {isLoading ? "Processing..." : "Verify User"}
      </button>

      <p style={{ marginTop: "20px", color: "blue" }}>{message}</p>
    </div>
  );
}

export default Counter;
