import { useState } from "react";
import Axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await Axios.post("http://localhost:7000/admin/Register", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data.success) {
        setMessage("Signup successful! Please login to continue.");
        setMessageType("success");
        
        // After successful signup, redirect to login page
        // User needs to login to get the auth token and proper role-based navigation
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(response.data.message || "Signup failed");
        setMessageType("error");
      }
    } catch {
      setMessage("Error while signing up");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Signup</h2>
      {message && <p style={{ color: messageType === "success" ? "green" : "red" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>Name</label><br />
          <input 
            type="text" 
            value={formData.name} 
            onChange={(e) => handleChange("name", e.target.value)} 
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>Email</label><br />
          <input 
            type="email" 
            value={formData.email} 
            onChange={(e) => handleChange("email", e.target.value)} 
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>Password</label><br />
          <input 
            type="password" 
            value={formData.password} 
            onChange={(e) => handleChange("password", e.target.value)} 
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {isLoading ? "Creating..." : "Signup"}
        </button>
      </form>
      <p style={{ marginTop: "10px" }}>
        <button 
          onClick={() => navigate("/login")} 
          style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
        >
          Already have an account? Login
        </button>
      </p>
    </div>
  );
}