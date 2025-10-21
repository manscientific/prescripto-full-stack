import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DoctorContext } from "../../context/DoctorContext";

const API_BASE = "http://localhost:8000";

function Verify() {
  const navigate = useNavigate();
  const { doctorData } = useContext(DoctorContext);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!doctorData?.name) {
      navigate("/doctor-login");
    }
  }, [doctorData, navigate]);

  // Fetch waiting patient count
  const fetchCount = async () => {
    if (!doctorData?.name) return;
    try {
      const res = await axios.get(`${API_BASE}/count/${doctorData.name}`);
      if (res.data.waiting_count !== undefined) {
        setCount(res.data.waiting_count);
      } else {
        setMessage("❌ Doctor not found. Please log in again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching patient count");
    }
  };

  // Auto-refresh every 2 seconds
  useEffect(() => {
    if (doctorData?.name) {
      fetchCount();
      const interval = setInterval(fetchCount, 2000);
      return () => clearInterval(interval);
    }
  }, [doctorData]);

  // Verify next patient
  const verifyUser = async () => {
    if (!doctorData?.name) return;
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_BASE}/verify/`, {
        doctorName: doctorData.name,
      });

      const newMessage = `✅ ${res.data.status} • Waiting patients: ${res.data.waiting_count}`;
      setMessage(newMessage);

      setVerificationHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          message: newMessage,
          status: "success",
        },
        ...prev.slice(0, 4),
      ]);

      fetchCount();
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
        },
        ...prev.slice(0, 4),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setVerificationHistory([]);
    setMessage("");
  };

  if (!doctorData?.name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-black text-gray-700">Redirecting to Doctor Login...</h2>
          <p className="text-gray-600 text-lg mt-2">Please wait while we redirect you</p>
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
            Doctor <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Verification Panel</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Secure patient verification using advanced face recognition technology
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
          
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-100/50 border-b-2 border-gray-200 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-4 rounded-2xl">
                  <div className="text-3xl text-white">🔒</div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Secure Verification Panel</h2>
                  <p className="text-xl text-gray-700 mt-2">Real-time patient authentication system</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/doctor-dashboard")}
                className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <span>🏠</span>
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Doctor Information Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 border-2 border-blue-200">
              <div className="flex items-center gap-6">
                <div className="bg-primary p-6 rounded-2xl">
                  <div className="text-4xl text-white">👨‍⚕️</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Verified Medical Professional</h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-white px-6 py-3 rounded-2xl border-2 border-primary/20">
                      <p className="text-2xl font-black text-primary">Dr. {doctorData.name}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-2xl border-2 border-green-300">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-bold text-lg">🟢 On Duty</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-lg font-semibold mb-3">Waiting Patients</p>
                    <p className="text-5xl font-black mb-2">{count}</p>
                    <p className="text-blue-200 text-base">Currently in queue</p>
                  </div>
                  <div className="bg-white/20 p-5 rounded-2xl">
                    <div className="text-4xl">⏱️</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-lg font-semibold mb-3">Verified Today</p>
                    <p className="text-5xl font-black mb-2">
                      {verificationHistory.filter((v) => v.status === "success").length}
                    </p>
                    <p className="text-green-200 text-base">Successful verifications</p>
                  </div>
                  <div className="bg-white/20 p-5 rounded-2xl">
                    <div className="text-4xl">✅</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border-2 border-gray-200 mb-8">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-gray-900 mb-4">Patient Verification</h3>
                <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                  Verify the next patient in queue using our secure face recognition system
                </p>
              </div>

              <button
                onClick={verifyUser}
                disabled={isLoading || count === 0}
                className={`w-full py-6 rounded-2xl font-black text-2xl shadow-2xl transform transition-all duration-300 ${
                  isLoading || count === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-3xl hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying Patient...
                  </div>
                ) : count === 0 ? (
                  <div className="flex items-center justify-center gap-3">
                    <span>⏸️</span>
                    <span>No Patients in Queue</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>🔍</span>
                    <span>Verify Next Patient</span>
                  </div>
                )}
              </button>

              {message && (
                <div className={`mt-6 p-6 rounded-2xl border-2 ${
                  message.includes("❌")
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : 'bg-green-50 border-green-300 text-green-800'
                }`}>
                  <p className="text-xl font-bold text-center">{message}</p>
                </div>
              )}
            </div>

            {/* Verification History */}
            {verificationHistory.length > 0 && (
              <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b-2 border-gray-200 px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                      <span>📋</span>
                      Recent Verifications
                    </h3>
                    <button 
                      onClick={clearHistory}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      Clear History
                    </button>
                  </div>
                </div>
                
                <div className="divide-y-2 divide-gray-100">
                  {verificationHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-6 transition-all duration-300 ${
                        item.status === "success"
                          ? 'bg-green-50/50 hover:bg-green-100/50'
                          : 'bg-red-50/50 hover:bg-red-100/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === "success" ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {item.message}
                            </span>
                            <span className="text-gray-600 font-medium text-sm bg-white px-3 py-1 rounded-full border">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty History State */}
            {verificationHistory.length === 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-2xl font-black text-gray-700 mb-4">No Verification History</h3>
                <p className="text-xl text-gray-600 max-w-md mx-auto">
                  Patient verification history will appear here after you start verifying patients
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Information */}
        <div className="text-center mt-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700">
              <div className="flex items-center gap-3 justify-center">
                <div className="text-2xl">🔒</div>
                <div>
                  <p className="font-bold text-lg">Secure</p>
                  <p className="text-sm">Encrypted verification</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="font-bold text-lg">Real-time</p>
                  <p className="text-sm">Live queue updates</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="text-2xl">👁️</div>
                <div>
                  <p className="font-bold text-lg">Face Recognition</p>
                  <p className="text-sm">Advanced AI technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Verify;