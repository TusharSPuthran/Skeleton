import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Axios from "axios";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    email: location.state?.email || "", 
    otp: location.state?.otp || "", 
    verificationToken: location.state?.verificationToken || "", 
    newPassword: "", 
    confirmPassword: "" 
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await Axios.post("http://localhost:7000/admin/reset-password", {
        email: formData.email,
        otp: formData.otp,
        verificationToken: formData.verificationToken,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        setMessage("Password reset successful! Redirecting to login...");
        setMessageType("success");
        // Redirect to login page instead of home after password reset
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(response.data.message || "Failed to reset password");
        setMessageType("error");
      }
    } catch {
      setMessage("Error resetting password");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Reset Password</h2>
      {message && <p style={{ color: messageType === "success" ? "green" : "red" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>New Password</label><br />
          <input 
            type="password" 
            value={formData.newPassword} 
            onChange={(e) => handleChange("newPassword", e.target.value)} 
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>Confirm Password</label><br />
          <input 
            type="password" 
            value={formData.confirmPassword} 
            onChange={(e) => handleChange("confirmPassword", e.target.value)} 
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {isLoading ? "Changing..." : "Change Password"}
        </button>
      </form>
      <p style={{ marginTop: "10px" }}>
        <button 
          onClick={() => navigate("/verify-otp", { state: { email: formData.email } })} 
          style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
        >
          Back
        </button>
      </p>
    </div>
  );
}