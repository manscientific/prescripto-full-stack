import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DoctorContext } from "../../context/DoctorContext";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:8000";

function Verify() {
  const navigate = useNavigate();
  const { doctorData } = useContext(DoctorContext);

  const videoRef = useRef(null);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [cameraActive, setCameraActive] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!doctorData?.name) {
      navigate("/doctor-login");
    }
  }, [doctorData, navigate]);

  // Start webcam
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Webcam error:", err);
      setMessage("❌ Unable to access webcam. Please check permissions.");
      setCameraActive(false);
      toast.error("Camera access denied. Please enable camera permissions.");
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, []);

  // Fetch waiting patient count
  const fetchCount = async () => {
    if (!doctorData?.name) return;
    try {
      const res = await axios.get(`${API_BASE}/count/${doctorData.name}`);
      setCount(res.data.waiting_count || 0);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching patient count");
    }
  };

  useEffect(() => {
    if (doctorData?.name) {
      fetchCount();
      const interval = setInterval(fetchCount, 2000);
      return () => clearInterval(interval);
    }
  }, [doctorData]);

  // Verify next patient
  const verifyUser = async () => {
    if (!doctorData?.name || !videoRef.current) return;

    setIsLoading(true);
    setMessage("");

    try {
      // Capture image from video
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/jpeg");

      // Send doctor name + captured image to backend
      const res = await axios.post(`${API_BASE}/verify/`, {
        doctorName: doctorData.name,
        image: imageBase64,
      });

      const newMessage = `✅ ${res.data.status} • Waiting patients: ${res.data.waiting_count}`;
      setMessage(newMessage);

      setVerificationHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          message: newMessage,
          status: res.data.status.includes("verified") ? "success" : "error",
          patientName: res.data.patient_name || "Unknown Patient",
        },
        ...prev.slice(0, 9), // Keep last 10 entries
      ]);

      fetchCount();
      toast.success(`Patient verified successfully!`);
    } catch (err) {
      console.error(err);
      const errorMessage =
        "❌ Verification failed. No patients in queue or system error.";
      setMessage(errorMessage);
      setVerificationHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          message: errorMessage,
          status: "error",
          patientName: "Verification Failed",
        },
        ...prev.slice(0, 9),
      ]);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setVerificationHistory([]);
    setMessage("");
    toast.info("Verification history cleared");
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  if (!doctorData?.name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-3xl font-black text-gray-700 mb-3">Loading...</h2>
          <p className="text-xl text-gray-600">Please wait while we verify your access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Patient <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Verification</span> Panel
          </h1>
          <p className="text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Advanced face recognition system for secure patient authentication
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - Camera & Controls */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Camera Section */}
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-blue-100/50 border-b-2 border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary p-3 rounded-xl">
                      <div className="text-xl text-white">📷</div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Live Camera Feed</h2>
                      <p className="text-gray-700">Real-time patient face capture</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleCamera}
                    className={`px-4 py-2 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      cameraActive 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {cameraActive ? '🛑 Stop Camera' : '📷 Start Camera'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border-4 border-gray-800">
                  {cameraActive ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      className="w-full h-96 object-cover"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-4">📷</div>
                        <p className="text-xl font-bold">Camera Offline</p>
                        <p className="text-gray-400">Click "Start Camera" to enable</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Overlay */}
                  <div className="absolute inset-0 border-2 border-green-400 rounded-2xl pointer-events-none opacity-50"></div>
                </div>

                {/* Verification Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={verifyUser}
                    disabled={isLoading || count === 0 || !cameraActive}
                    className={`px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      isLoading 
                        ? 'bg-gray-500 text-white' 
                        : count === 0 || !cameraActive
                        ? 'bg-gray-400 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-3xl'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying Patient...
                      </div>
                    ) : count === 0 ? (
                      "⏳ No Patients in Queue"
                    ) : !cameraActive ? (
                      "📷 Camera Required"
                    ) : (
                      <div className="flex items-center gap-3">
                        <span>👤</span>
                        Verify Next Patient
                        <span>→</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 text-center">
                <div className="text-4xl text-blue-500 mb-3">👥</div>
                <div className="text-3xl font-black text-gray-900 mb-2">{count}</div>
                <div className="text-lg text-gray-700 font-semibold">Patients Waiting</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 text-center">
                <div className="text-4xl text-green-500 mb-3">✅</div>
                <div className="text-3xl font-black text-gray-900 mb-2">
                  {verificationHistory.filter(item => item.status === 'success').length}
                </div>
                <div className="text-lg text-gray-700 font-semibold">Verified Today</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 text-center">
                <div className="text-4xl text-purple-500 mb-3">⚡</div>
                <div className="text-3xl font-black text-gray-900 mb-2">98%</div>
                <div className="text-lg text-gray-700 font-semibold">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Column - Verification History */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden h-full">
              <div className="bg-gradient-to-r from-primary/10 to-blue-100/50 border-b-2 border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary p-3 rounded-xl">
                      <div className="text-xl text-white">📋</div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Verification History</h2>
                      <p className="text-gray-700">Recent patient authentications</p>
                    </div>
                  </div>
                  <button
                    onClick={clearHistory}
                    disabled={verificationHistory.length === 0}
                    className="bg-gray-500 text-white px-4 py-2 rounded-2xl font-bold text-sm hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[600px] overflow-y-auto">
                {verificationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-black text-gray-700 mb-2">No Verifications Yet</h3>
                    <p className="text-gray-600">Patient verifications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verificationHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                          item.status === "success"
                            ? "bg-green-50 border-green-300 hover:shadow-lg"
                            : "bg-red-50 border-red-300 hover:shadow-lg"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            item.status === "success" ? "bg-green-500" : "bg-red-500"
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-bold text-lg ${
                                item.status === "success" ? "text-green-800" : "text-red-800"
                              }`}>
                                {item.patientName}
                              </span>
                              <span className="text-sm text-gray-500">{item.timestamp}</span>
                            </div>
                            <p className={`text-sm ${
                              item.status === "success" ? "text-green-700" : "text-red-700"
                            }`}>
                              {item.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History Footer */}
              {verificationHistory.length > 0 && (
                <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-4">
                  <p className="text-center text-gray-600 text-sm">
                    Showing {verificationHistory.length} verification{verificationHistory.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Status Message */}
        {message && (
          <div className="mt-8 bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6">
            <h3 className="text-2xl font-black text-gray-900 mb-3 flex items-center gap-3">
              <span>📢</span>
              Current Status
            </h3>
            <p className={`text-lg font-semibold ${
              message.includes('✅') ? 'text-green-700' : 'text-red-700'
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => navigate('/doctor-dashboard')}
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-3xl text-blue-500 mb-3">🏠</div>
            <div className="text-lg font-black text-gray-900 mb-2">Dashboard</div>
            <div className="text-gray-600">Return to main dashboard</div>
          </button>
          
          <button 
            onClick={fetchCount}
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-3xl text-green-500 mb-3">🔄</div>
            <div className="text-lg font-black text-gray-900 mb-2">Refresh Count</div>
            <div className="text-gray-600">Update waiting patients</div>
          </button>
          
          <button 
            onClick={startVideo}
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-3xl text-purple-500 mb-3">📷</div>
            <div className="text-lg font-black text-gray-900 mb-2">Restart Camera</div>
            <div className="text-gray-600">Reinitialize camera feed</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Verify;