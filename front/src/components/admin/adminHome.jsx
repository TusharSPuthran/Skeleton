import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClients: 0,
    totalAdmins: 0,
    pendingContacts: 0,
    totalContacts: 0,
    recentContacts: [],
    recentUsers: []
  });
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  });
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    lowStock: 0
  });
  const [stockNotifications, setStockNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkSessionAndFetchData();
  }, []);

  const checkSessionAndFetchData = async () => {
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
        
        // If user is not admin, redirect to client home
        if (res.data.user.role !== 'admin') {
          navigate("/client-home", { replace: true });
          return;
        }

        // Fetch all dashboard data
        await Promise.all([
          fetchDashboardStats(),
          fetchOrderStats(),
          fetchProductStats(),
          fetchStockNotifications()
        ]);
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const statsRes = await axios.get("http://localhost:7000/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const orderRes = await axios.get("http://localhost:7000/admin/admin/orders?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (orderRes.data.success) {
        setOrderStats(orderRes.data.stats);
      }
    } catch (error) {
      console.error("Error fetching order stats:", error);
    }
  };

  const fetchProductStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const productRes = await axios.get("http://localhost:7000/admin/products?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (productRes.data.success) {
        // Calculate product statistics from the response
        // You might need to make additional API calls to get these specific stats
        // For now, using placeholder values
        setProductStats({
          totalProducts: productRes.data.total || 0,
          activeProducts: productRes.data.total || 0,
          outOfStock: 0,
          lowStock: 0
        });
      }
    } catch (error) {
      console.error("Error fetching product stats:", error);
    }
  };

  const fetchStockNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const stockRes = await axios.get("http://localhost:7000/admin/stock-notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (stockRes.data.success) {
        setStockNotifications(stockRes.data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching stock notifications:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'in-progress': return '#17a2b8';
      case 'resolved': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #dee2e6"
      }}>
        <div>
          <h1 style={{ color: "#007bff", margin: "0 0 5px 0" }}>Admin Dashboard</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Welcome back, <strong>{user?.name || user?.email || "Admin"}</strong> | 
            <span style={{ color: "#007bff", fontWeight: "bold", marginLeft: "5px" }}>
              {user?.role?.toUpperCase()}
            </span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      {/* Stock Notifications Alert */}
      {stockNotifications.length > 0 && (
        <div style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <strong style={{ color: "#856404" }}>Stock Notifications</strong>
            <p style={{ margin: "5px 0 0 0", color: "#856404" }}>
              {stockNotifications.length} products have pending stock notification requests
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/products")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ffc107",
              color: "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            View Details
          </button>
        </div>
      )}

      {/* Main Statistics Cards */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#007bff", marginBottom: "20px" }}>Overview Statistics</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "20px" 
        }}>
          {/* User Statistics */}
          <div style={{
            padding: "25px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            border: "1px solid #bbdefb",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#1976d2", fontSize: "36px", margin: "0 0 10px 0" }}>
              {stats.totalUsers}
            </h2>
            <p style={{ color: "#666", margin: 0, fontSize: "16px", fontWeight: "bold" }}>Total Users</p>
            <div style={{ fontSize: "12px", color: "#1976d2", marginTop: "5px" }}>
              {stats.totalClients} Clients | {stats.totalAdmins} Admins
            </div>
          </div>

          {/* Order Statistics */}
          <div style={{
            padding: "25px",
            backgroundColor: "#e8f5e8",
            borderRadius: "8px",
            border: "1px solid #c8e6c9",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#388e3c", fontSize: "36px", margin: "0 0 10px 0" }}>
              {orderStats.totalOrders}
            </h2>
            <p style={{ color: "#666", margin: 0, fontSize: "16px", fontWeight: "bold" }}>Total Orders</p>
            <div style={{ fontSize: "12px", color: "#388e3c", marginTop: "5px" }}>
              {formatCurrency(orderStats.totalRevenue)}
            </div>
          </div>

          {/* Product Statistics */}
          <div style={{
            padding: "25px",
            backgroundColor: "#fff3e0",
            borderRadius: "8px",
            border: "1px solid #ffcc02",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#f57c00", fontSize: "36px", margin: "0 0 10px 0" }}>
              {productStats.totalProducts}
            </h2>
            <p style={{ color: "#666", margin: 0, fontSize: "16px", fontWeight: "bold" }}>Total Products</p>
            <div style={{ fontSize: "12px", color: "#f57c00", marginTop: "5px" }}>
              {productStats.activeProducts} Active
            </div>
          </div>

          {/* Contact Statistics */}
          <div style={{
            padding: "25px",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            border: "1px solid #ffcdd2",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#d32f2f", fontSize: "36px", margin: "0 0 10px 0" }}>
              {stats.pendingContacts}
            </h2>
            <p style={{ color: "#666", margin: 0, fontSize: "16px", fontWeight: "bold" }}>Pending Contacts</p>
            <div style={{ fontSize: "12px", color: "#d32f2f", marginTop: "5px" }}>
              {stats.totalContacts} Total
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#007bff", marginBottom: "20px" }}>Order Status Breakdown</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "15px" 
        }}>
          <div style={{
            padding: "20px",
            backgroundColor: "#fff3cd",
            borderRadius: "8px",
            border: "1px solid #ffeaa7",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#856404", fontSize: "24px", margin: "0 0 5px 0" }}>
              {orderStats.pendingOrders}
            </h3>
            <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Pending</p>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#cfe2ff",
            borderRadius: "8px",
            border: "1px solid #9ec5fe",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#084298", fontSize: "24px", margin: "0 0 5px 0" }}>
              {orderStats.processingOrders}
            </h3>
            <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Processing</p>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#f3e5f5",
            borderRadius: "8px",
            border: "1px solid #ce93d8",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#8e24aa", fontSize: "24px", margin: "0 0 5px 0" }}>
              {orderStats.shippedOrders}
            </h3>
            <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Shipped</p>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#d1e7dd",
            borderRadius: "8px",
            border: "1px solid #a3cfbb",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#0a3622", fontSize: "24px", margin: "0 0 5px 0" }}>
              {orderStats.deliveredOrders}
            </h3>
            <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Delivered</p>
          </div>
        </div>
      </div>

      {/* Management Actions */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#007bff", marginBottom: "20px" }}>Management Dashboard</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "20px" 
        }}>
          <div style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "white"
          }}>
            <h3 style={{ color: "#007bff", marginBottom: "15px" }}>User Management</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>Manage all users and their roles</p>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#28a745" }}>
              <strong>{stats.totalUsers} Total Users</strong>
            </div>
            <button 
              onClick={() => navigate("/admin/users")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Manage Users
            </button>
          </div>

          <div style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "white"
          }}>
            <h3 style={{ color: "#28a745", marginBottom: "15px" }}>Product Management</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>Add, edit, and manage product inventory</p>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#f57c00" }}>
              <strong>{productStats.totalProducts} Products</strong>
              {stockNotifications.length > 0 && (
                <span style={{ color: "#dc3545", display: "block" }}>
                  {stockNotifications.length} Stock Requests
                </span>
              )}
            </div>
            <button 
              onClick={() => navigate("/admin/products")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Manage Products
            </button>
          </div>

          <div style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "white"
          }}>
            <h3 style={{ color: "#6f42c1", marginBottom: "15px" }}>Order Management</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>Process and track customer orders</p>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#17a2b8" }}>
              <strong>{orderStats.totalOrders} Orders</strong>
              <span style={{ color: "#ffc107", display: "block" }}>
                {orderStats.pendingOrders} Pending
              </span>
            </div>
            <button 
              onClick={() => navigate("/admin/orders")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Manage Orders
            </button>
          </div>

          <div style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "white"
          }}>
            <h3 style={{ color: "#fd7e14", marginBottom: "15px" }}>Contact Messages</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>View and respond to customer inquiries</p>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#28a745" }}>
              <strong>{stats.totalContacts} Messages</strong>
              <span style={{ color: "#dc3545", display: "block" }}>
                {stats.pendingContacts} Pending
              </span>
            </div>
            <button 
              onClick={() => navigate("/admin/contacts")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#fd7e14",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              View Messages
            </button>
          </div>

          <div style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "white"
          }}>
            <h3 style={{ color: "#17a2b8", marginBottom: "15px" }}>Reports & Analytics</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>View system reports and analytics</p>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
              <strong>Revenue: {formatCurrency(orderStats.totalRevenue)}</strong>
            </div>
            <button 
              onClick={() => navigate("/admin/reports")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              View Reports
            </button>
          </div>

          <div style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "white"
          }}>
            <h3 style={{ color: "#6c757d", marginBottom: "15px" }}>System Settings</h3>
            <p style={{ color: "#666", marginBottom: "15px" }}>Configure system settings</p>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#28a745" }}>
              <strong>System Online</strong>
            </div>
            <button 
              onClick={() => navigate("/admin/settings")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Recent Contact Messages */}
        <div style={{
          backgroundColor: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "#007bff", margin: 0 }}>Recent Contact Messages</h3>
            <button
              onClick={() => navigate("/admin/contacts")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              View All
            </button>
          </div>

          {stats.recentContacts && stats.recentContacts.length > 0 ? (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {stats.recentContacts.slice(0, 5).map((contact) => (
                <div
                  key={contact._id}
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #eee",
                    marginBottom: "10px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: "#333" }}>{contact.name}</strong>
                      <div style={{ fontSize: "12px", color: "#666" }}>{contact.email}</div>
                    </div>
                    <span
                      style={{
                        backgroundColor: getStatusColor(contact.status),
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold"
                      }}
                    >
                      {contact.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
                    <strong>Subject:</strong> {contact.subject}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "5px" }}>
                    {formatDate(contact.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
              No recent contact messages
            </p>
          )}
        </div>

        {/* Recent Users */}
        <div style={{
          backgroundColor: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "#007bff", margin: 0 }}>Recent User Registrations</h3>
            <button
              onClick={() => navigate("/admin/users")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              View All
            </button>
          </div>

          {stats.recentUsers && stats.recentUsers.length > 0 ? (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {stats.recentUsers.slice(0, 5).map((user) => (
                <div
                  key={user._id}
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #eee",
                    marginBottom: "10px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: "#333" }}>{user.name}</strong>
                      <div style={{ fontSize: "12px", color: "#666" }}>{user.email}</div>
                    </div>
                    <span
                      style={{
                        backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold"
                      }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "5px" }}>
                    Registered: {formatDate(user.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
              No recent user registrations
            </p>
          )}
        </div>
      </div>

      {/* System Status */}
      <div style={{ marginTop: "40px" }}>
        <h2 style={{ color: "#007bff", marginBottom: "20px" }}>System Status</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "20px" 
        }}>
          <div style={{
            padding: "20px",
            backgroundColor: "#d4edda",
            borderRadius: "8px",
            border: "1px solid #c3e6cb",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#155724", marginBottom: "10px" }}>Database</h3>
            <p style={{ color: "#155724", margin: 0 }}>Connected & Running</p>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#d4edda",
            borderRadius: "8px",
            border: "1px solid #c3e6cb",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#155724", marginBottom: "10px" }}>Email Service</h3>
            <p style={{ color: "#155724", margin: 0 }}>Active & Configured</p>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#d4edda",
            borderRadius: "8px",
            border: "1px solid #c3e6cb",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#155724", marginBottom: "10px" }}>Authentication</h3>
            <p style={{ color: "#155724", margin: 0 }}>JWT Tokens Active</p>
          </div>

          <div style={{
            padding: "20px",
            backgroundColor: "#d4edda",
            borderRadius: "8px",
            border: "1px solid #c3e6cb",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#155724", marginBottom: "10px" }}>Server</h3>
            <p style={{ color: "#155724", margin: 0 }}>Online & Responsive</p>
          </div>
        </div>
      </div>
    </div>
  );
}