import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Axios from "axios";

export default function OTPVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await Axios.post("http://localhost:7000/admin/verify-otp", { email, otp });
      if (response.data.success) {
        setMessage("OTP verified! Redirecting...");
        setMessageType("success");
        setTimeout(() => navigate("/reset-password", { state: { email, otp, verified: true, verificationToken: response.data.verificationToken } }), 1000);
      } else {
        setMessage(response.data.message || "Invalid OTP");
        setMessageType("error");
      }
    } catch {
      setMessage("Error verifying OTP");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>OTP Verification</h2>
      <p>Email: {email}</p>
      {message && <p style={{ color: messageType === "success" ? "green" : "red" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label style={{ fontWeight: "bold", color: "#333" }}>Enter OTP</label><br />
        <input 
          type="text" 
          value={otp} 
          onChange={(e) => setOtp(e.target.value)} 
          maxLength={6} 
          style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
        /><br />
        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ width: "100%", marginTop: "10px", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
      <p style={{ marginTop: "10px" }}>
        <button 
          onClick={() => navigate("/forgot-password")} 
          style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
        >
          Back
        </button>
      </p>
    </div>
  );
}
