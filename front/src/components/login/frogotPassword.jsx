import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await Axios.post("http://localhost:7000/admin/forgot-password", { email });
      if (response.data.success) {
        setMessage("OTP sent to your email");
        setMessageType("success");
        setTimeout(() => navigate("/verify-otp", { state: { email } }), 1000);
      } else {
        setMessage(response.data.message || "Failed to send OTP");
        setMessageType("error");
      }
    } catch {
      setMessage("Error sending OTP");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Forgot Password</h2>
      {message && <p style={{ color: messageType === "success" ? "green" : "red" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label style={{ fontWeight: "bold", color: "#333" }}>Email</label><br />
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
        /><br />
        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ width: "100%", marginTop: "10px", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {isLoading ? "Sending..." : "Send OTP"}
        </button>
      </form>
      <p style={{ marginTop: "10px" }}>
        <button 
          onClick={() => navigate("/login")} 
          style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
        >
          Back to Login
        </button>
      </p>
    </div>
  );
}
