import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get("http://localhost:7000/admin/check-session", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setUser(res.data.user);
          
          // Redirect to appropriate home based on role
          if (res.data.user.role === 'admin') {
            navigate("/admin-home", { replace: true });
          } else if (res.data.user.role === 'client') {
            navigate("/client-home", { replace: true });
          }
        } else {
          handleLogout();
        }
      } catch (err) {
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndRedirect();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime"); // cleanup in case it's still set
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // This should rarely be seen as users will be redirected
  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#007bff" }}>Welcome {user?.email || "User"} 🎉</h1>
      <p>You are logged in securely.</p>
      <p>Redirecting to appropriate dashboard...</p>

      <button 
        onClick={handleLogout} 
        style={{ marginTop: "20px", padding: "10px", backgroundColor: "red", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Logout
      </button>
    </div>
  );
}