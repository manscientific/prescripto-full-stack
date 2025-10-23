import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:8000";

function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [doctor, setDoctor] = useState(null);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [registrationHistory, setRegistrationHistory] = useState([]);

  useEffect(() => {
    if (location.state?.doctor) {
      setDoctor(location.state.doctor);
    } else {
      navigate('/doctors');
    }
  }, [location.state, navigate]);

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
      setMessage("❌ Unable to access webcam. Please check camera permissions.");
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

  const fetchCount = async () => {
    if (!doctor) return;
    try {
      const res = await axios.get(`${API_BASE}/count/${doctor.name}`);
      setCount(res.data.waiting_count || 0);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching waiting count");
    }
  };

  useEffect(() => {
    if (doctor) {
      fetchCount();
      const interval = setInterval(fetchCount, 2000);
      return () => clearInterval(interval);
    }
  }, [doctor]);

  const registerUser = async () => {
    if (!doctor || !videoRef.current) return;
    setIsLoading(true);
    setMessage("");

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/jpeg");

      const res = await axios.post(`${API_BASE}/register/`, {
        doctorName: doctor.name,
        image: imageBase64,
      });

      if (res.data.status === "success") {
        const successMessage = `✅ Successfully registered with Dr. ${res.data.doctorName} • Your waiting position: ${res.data.waiting_count}`;
        setMessage(successMessage);
        
        setRegistrationHistory((prev) => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            message: successMessage,
            position: res.data.waiting_count,
            status: "success"
          },
          ...prev.slice(0, 4),
        ]);

        fetchCount();
        toast.success("Registration successful! Face registered successfully.");
      } else {
        const errorMessage = `❌ ${res.data.message}`;
        setMessage(errorMessage);
        setRegistrationHistory((prev) => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            message: errorMessage,
            status: "error"
          },
          ...prev.slice(0, 4),
        ]);
        toast.error("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "❌ Registration failed. Please try again.";
      setMessage(errorMessage);
      setRegistrationHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          message: errorMessage,
          status: "error"
        },
        ...prev.slice(0, 4),
      ]);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  const clearHistory = () => {
    setRegistrationHistory([]);
    setMessage("");
    toast.info("Registration history cleared");
  };

  const estimatedWaitTime = count * 15; // 15 minutes per patient

  const formatWaitTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minutes` : ''}`;
    }
  };

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-3xl font-black text-gray-700 mb-3">Loading...</h2>
          <p className="text-xl text-gray-600">Please wait while we load doctor information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Patient <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Registration</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Secure face recognition registration for your medical appointment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Registration Form */}
          <div className="space-y-8">
            
            {/* Doctor Information Card */}
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b-2 border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <div className="text-xl text-white">👨‍⚕️</div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Appointment Details</h2>
                    <p className="text-gray-700">Your selected healthcare provider</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={doctor.image} 
                    alt={doctor.name}
                    className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80/3B82F6/FFFFFF?text=👨‍⚕️';
                    }}
                  />
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Dr. {doctor.name}</h3>
                    <p className="text-lg text-blue-600 font-bold">{doctor.speciality}</p>
                    <p className="text-gray-600">{doctor.degree}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
                    <div className="text-2xl text-blue-600 mb-2">👥</div>
                    <div className="text-xl font-black text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">Waiting Patients</div>
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-200">
                    <div className="text-2xl text-orange-600 mb-2">⏱️</div>
                    <div className="text-xl font-black text-gray-900">{formatWaitTime(estimatedWaitTime)}</div>
                    <div className="text-sm text-gray-600">Est. Wait Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Section */}
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b-2 border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-3 rounded-xl">
                      <div className="text-xl text-white">📷</div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Face Registration</h2>
                      <p className="text-gray-700">Look directly at the camera</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleCamera}
                    className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      cameraActive 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {cameraActive ? '🛑 Stop' : '📷 Start'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border-4 border-gray-800 mb-4">
                  {cameraActive ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-4">📷</div>
                        <p className="text-xl font-bold">Camera Offline</p>
                        <p className="text-gray-400">Click "Start" to enable camera</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 border-2 border-green-400 rounded-2xl pointer-events-none opacity-50"></div>
                </div>

                <button
                  onClick={registerUser}
                  disabled={isLoading || !cameraActive}
                  className={`w-full py-4 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    isLoading 
                      ? 'bg-gray-500 text-white' 
                      : !cameraActive
                      ? 'bg-gray-400 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-3xl'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Registration...
                    </div>
                  ) : !cameraActive ? (
                    "📷 Camera Required"
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>👤</span>
                      Register My Face
                      <span>→</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Registration History */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b-2 border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-3 rounded-xl">
                      <div className="text-xl text-white">📋</div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Registration History</h2>
                      <p className="text-gray-700">Recent registration attempts</p>
                    </div>
                  </div>
                  <button
                    onClick={clearHistory}
                    disabled={registrationHistory.length === 0}
                    className="bg-gray-500 text-white px-4 py-2 rounded-2xl font-bold text-sm hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {registrationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-black text-gray-700 mb-2">No Registrations Yet</h3>
                    <p className="text-gray-600">Your registration history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrationHistory.map((item) => (
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
                                {item.status === "success" ? "✅ Success" : "❌ Failed"}
                              </span>
                              <span className="text-sm text-gray-500">{item.timestamp}</span>
                            </div>
                            <p className={`text-sm ${
                              item.status === "success" ? "text-green-700" : "text-red-700"
                            }`}>
                              {item.message}
                            </p>
                            {item.position && (
                              <div className="mt-2 bg-white px-3 py-1 rounded-full inline-block border border-green-300">
                                <span className="text-green-700 font-bold">Position: #{item.position}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-6">
              <h3 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                <span>💡</span>
                Registration Tips
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  Ensure good lighting for better face recognition
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-xl">📷</span>
                  Look directly at the camera without glasses or hats
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-xl">⚡</span>
                  Registration typically takes 2-3 seconds
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-xl">🔄</span>
                  Wait for confirmation before leaving the page
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/doctors')}
                className="bg-gray-500 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                ← Back
              </button>
              <button
                onClick={startVideo}
                className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                🔄 Restart Camera
              </button>
            </div>
          </div>
        </div>

        {/* Current Status Message */}
        {message && (
          <div className="mt-8 bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6">
            <h3 className="text-2xl font-black text-gray-900 mb-3 flex items-center gap-3">
              <span>📢</span>
              Registration Status
            </h3>
            <p className={`text-lg font-semibold ${
              message.includes('✅') ? 'text-green-700' : 'text-red-700'
            }`}>
              {message}
            </p>
          </div>
        )}

        <style jsx>{`
          .video-overlay {
            position: relative;
          }
          .video-overlay::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid #10B981;
            border-radius: 1rem;
            pointer-events: none;
            opacity: 0.5;
          }
        `}</style>
      </div>
    </div>
  );
}

export default Register;