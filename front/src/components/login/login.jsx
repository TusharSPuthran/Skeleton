import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Axios from "axios";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      const response = await Axios.post("http://localhost:7000/admin/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data.success) {
        // Store auth token
        if (response.data.authToken) {
          localStorage.setItem("authToken", response.data.authToken);
        }
        
        // Store user info including role
        if (response.data.loggedInUser) {
          localStorage.setItem("user", JSON.stringify(response.data.loggedInUser));
        }
        
        setMessage("Login successful! Redirecting...");
        setMessageType("success");
        
        // Navigate based on role using the navigationRoute from backend
        setTimeout(() => {
          const navigationRoute = response.data.navigationRoute;
          if (navigationRoute === 'adminHome') {
            navigate("/admin-home");
          } else if (navigationRoute === 'clientHome') {
            navigate("/client-home");
          } else {
            // Fallback based on user role
            const userRole = response.data.loggedInUser.role;
            if (userRole === 'admin') {
              navigate("/admin-home");
            } else {
              navigate("/client-home");
            }
          }
        }, 1000);
      } else {
        setMessage(response.data.message || "Invalid credentials");
        setMessageType("error");
      }
    } catch {
      setMessage("Login failed. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Login</h2>
      {message && <p style={{ color: messageType === "success" ? "green" : "red" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
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
          {isLoading ? "Signing in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "10px" }}>
        <button 
          onClick={() => navigate("/forgot-password")} 
          style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
        >
          Forgot Password?
        </button>
      </p>
      <p style={{ marginTop: "10px" }}>
        Don't have an account? <Link to="/signup" style={{ color: "#007bff", textDecoration: "underline" }}>Signup</Link>
      </p>
    </div>
  );
}