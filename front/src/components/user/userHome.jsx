import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UserHome() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userStats, setUserStats] = useState({
    totalContacts: 0,
    pendingContacts: 0,
    inProgressContacts: 0,
    resolvedContacts: 0,
    recentContacts: []
  });
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    recentOrders: []
  });
  const [cartStats, setCartStats] = useState({
    totalItems: 0,
    totalAmount: 0
  });
  const [contactHistory, setContactHistory] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [updateMessage, setUpdateMessage] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState('');
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
        setProfileData({
          name: res.data.user.name || '',
          email: res.data.user.email || '',
          phone: res.data.user.phone || ''
        });
        
        // If user is admin, redirect to admin home
        if (res.data.user.role === 'admin') {
          navigate("/admin-home", { replace: true });
          return;
        }

        // Fetch all user data
        await Promise.all([
          fetchUserContacts(),
          fetchUserOrders(),
          fetchCartData()
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

  const fetchUserContacts = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const contactsRes = await axios.get("http://localhost:7000/admin/my-contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (contactsRes.data.success) {
        const contacts = contactsRes.data.contacts;
        setContactHistory(contacts);
        
        // Calculate contact statistics
        setUserStats({
          totalContacts: contacts.length,
          pendingContacts: contacts.filter(c => c.status === 'pending').length,
          inProgressContacts: contacts.filter(c => c.status === 'in-progress').length,
          resolvedContacts: contacts.filter(c => c.status === 'resolved').length,
          recentContacts: contacts.slice(0, 5)
        });
      }
    } catch (error) {
      console.error("Error fetching user contacts:", error);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const ordersRes = await axios.get("http://localhost:7000/admin/orders?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (ordersRes.data.success) {
        const orders = ordersRes.data.orders;
        setOrderStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
          shippedOrders: orders.filter(o => o.status === 'shipped').length,
          deliveredOrders: orders.filter(o => o.status === 'delivered').length,
          recentOrders: orders.slice(0, 5)
        });
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  const fetchCartData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const cartRes = await axios.get("http://localhost:7000/admin/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (cartRes.data.success) {
        const cart = cartRes.data.cart;
        setCartStats({
          totalItems: cart.totalItems || 0,
          totalAmount: cart.totalAmount || 0
        });
      }
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setUpdateMessage('');
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        "http://localhost:7000/admin/profile",
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUser({ ...user, ...profileData });
        const updatedUser = { ...JSON.parse(localStorage.getItem("user")), ...profileData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setEditingProfile(false);
        setUpdateMessage('Profile updated successfully!');
        setTimeout(() => setUpdateMessage(''), 3000);
      } else {
        setUpdateMessage(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      setUpdateMessage('Error updating profile');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        "http://localhost:7000/admin/change-password",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPasswordMessage('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setChangingPassword(false);
        setTimeout(() => setPasswordMessage(''), 3000);
      } else {
        setPasswordMessage(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordMessage('Error changing password');
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
      case 'confirmed': return '#17a2b8';
      case 'processing': return '#fd7e14';
      case 'shipped': return '#6f42c1';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '🔄';
      case 'resolved': return '✅';
      case 'confirmed': return '📋';
      case 'processing': return '⚙️';
      case 'shipped': return '🚚';
      case 'delivered': return '📦';
      case 'cancelled': return '❌';
      default: return '❓';
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
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
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
          <h1 style={{ color: "#28a745", margin: "0 0 5px 0" }}>My Dashboard</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Welcome back, <strong>{user?.name || user?.email || "User"}</strong> | 
            <span style={{ color: "#28a745", fontWeight: "bold", marginLeft: "5px" }}>
              {user?.role?.toUpperCase()}
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/products")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Browse Products
          </button>
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
      </div>

      {/* Quick Shopping Actions */}
      {cartStats.totalItems > 0 && (
        <div style={{
          backgroundColor: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <strong style={{ color: "#155724" }}>You have {cartStats.totalItems} items in your cart</strong>
            <p style={{ margin: "5px 0 0 0", color: "#155724" }}>
              Total: {formatCurrency(cartStats.totalAmount)}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/cart")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              View Cart
            </button>
            <button
              onClick={() => navigate("/checkout")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ 
        display: "flex", 
        borderBottom: "2px solid #dee2e6", 
        marginBottom: "30px",
        backgroundColor: "white",
        borderRadius: "8px 8px 0 0"
      }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'orders', label: '📦 My Orders' },
          { id: 'messages', label: '📧 Messages' },
          { id: 'profile', label: '👤 Profile' },
          { id: 'settings', label: '⚙️ Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "15px 25px",
              border: "none",
              backgroundColor: activeTab === tab.id ? "#28a745" : "transparent",
              color: activeTab === tab.id ? "white" : "#666",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              cursor: "pointer",
              borderRadius: activeTab === tab.id ? "8px 8px 0 0" : "0"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "0 0 8px 8px", padding: "30px" }}>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ color: "#28a745", marginBottom: "25px" }}>Dashboard Overview</h2>
            
            {/* Statistics Cards */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "20px", 
              marginBottom: "30px" 
            }}>
              <div style={{
                padding: "20px",
                backgroundColor: "#e3f2fd",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #bbdefb"
              }}>
                <h3 style={{ color: "#1976d2", fontSize: "28px", margin: "0 0 10px 0" }}>
                  {orderStats.totalOrders}
                </h3>
                <p style={{ color: "#666", margin: 0 }}>Total Orders</p>
              </div>

              <div style={{
                padding: "20px",
                backgroundColor: "#fff3e0",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #ffcc02"
              }}>
                <h3 style={{ color: "#f57c00", fontSize: "28px", margin: "0 0 10px 0" }}>
                  {orderStats.pendingOrders}
                </h3>
                <p style={{ color: "#666", margin: 0 }}>Active Orders</p>
              </div>

              <div style={{
                padding: "20px",
                backgroundColor: "#e8f5e8",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #c8e6c9"
              }}>
                <h3 style={{ color: "#388e3c", fontSize: "28px", margin: "0 0 10px 0" }}>
                  {userStats.totalContacts}
                </h3>
                <p style={{ color: "#666", margin: 0 }}>Messages Sent</p>
              </div>

              <div style={{
                padding: "20px",
                backgroundColor: "#f3e5f5",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #ce93d8"
              }}>
                <h3 style={{ color: "#8e24aa", fontSize: "28px", margin: "0 0 10px 0" }}>
                  {cartStats.totalItems}
                </h3>
                <p style={{ color: "#666", margin: 0 }}>Cart Items</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#28a745", marginBottom: "15px" }}>Quick Actions</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
                <button
                  onClick={() => navigate("/products")}
                  style={{
                    padding: "15px 20px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    textAlign: "left"
                  }}
                >
                  🛍️ Browse Products
                  <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "5px" }}>
                    Discover our latest products
                  </div>
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  style={{
                    padding: "15px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    textAlign: "left"
                  }}
                >
                  🛒 View Cart ({cartStats.totalItems})
                  <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "5px" }}>
                    {formatCurrency(cartStats.totalAmount)}
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  style={{
                    padding: "15px 20px",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    textAlign: "left"
                  }}
                >
                  📦 Track Orders
                  <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "5px" }}>
                    {orderStats.pendingOrders} active orders
                  </div>
                </button>

                <button
                  onClick={() => navigate("/contact-us")}
                  style={{
                    padding: "15px 20px",
                    backgroundColor: "#fd7e14",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    textAlign: "left"
                  }}
                >
                  📧 Contact Support
                  <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "5px" }}>
                    Get help with your orders
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
              {/* Recent Orders */}
              <div>
                <h3 style={{ color: "#28a745", marginBottom: "15px" }}>Recent Orders</h3>
                {orderStats.recentOrders.length > 0 ? (
                  <div>
                    {orderStats.recentOrders.map((order) => (
                      <div
                        key={order._id}
                        style={{
                          padding: "15px",
                          border: "1px solid #eee",
                          borderRadius: "6px",
                          marginBottom: "10px",
                          backgroundColor: "#fafafa"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ color: "#333" }}>{order.orderId}</strong>
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                backgroundColor: getStatusColor(order.status),
                                color: "white",
                                padding: "4px 12px",
                                borderRadius: "15px",
                                fontSize: "12px",
                                fontWeight: "bold"
                              }}
                            >
                              {getStatusIcon(order.status)} {order.status.toUpperCase()}
                            </span>
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                              {formatCurrency(order.orderSummary.totalAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#666", fontStyle: "italic" }}>No orders placed yet.</p>
                )}
              </div>

              {/* Recent Messages */}
              <div>
                <h3 style={{ color: "#28a745", marginBottom: "15px" }}>Recent Messages</h3>
                {userStats.recentContacts.length > 0 ? (
                  <div>
                    {userStats.recentContacts.map((contact) => (
                      <div
                        key={contact._id}
                        style={{
                          padding: "15px",
                          border: "1px solid #eee",
                          borderRadius: "6px",
                          marginBottom: "10px",
                          backgroundColor: "#fafafa"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ color: "#333" }}>{contact.subject}</strong>
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                              {formatDate(contact.createdAt)}
                            </div>
                          </div>
                          <span
                            style={{
                              backgroundColor: getStatusColor(contact.status),
                              color: "white",
                              padding: "4px 12px",
                              borderRadius: "15px",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}
                          >
                            {getStatusIcon(contact.status)} {contact.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#666", fontStyle: "italic" }}>No messages sent yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ color: "#28a745", margin: 0 }}>My Orders</h2>
              <button
                onClick={() => navigate("/products")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                🛍️ Shop More
              </button>
            </div>

            {/* Order Statistics */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
              gap: "15px", 
              marginBottom: "30px" 
            }}>
              <div style={{
                padding: "15px",
                backgroundColor: "#fff3e0",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #ffcc02"
              }}>
                <h4 style={{ color: "#f57c00", margin: "0 0 5px 0" }}>{orderStats.pendingOrders}</h4>
                <p style={{ color: "#666", margin: 0, fontSize: "12px" }}>Active Orders</p>
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: "#f3e5f5",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #ce93d8"
              }}>
                <h4 style={{ color: "#8e24aa", margin: "0 0 5px 0" }}>{orderStats.shippedOrders}</h4>
                <p style={{ color: "#666", margin: 0, fontSize: "12px" }}>Shipped</p>
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: "#e8f5e8",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #c8e6c9"
              }}>
                <h4 style={{ color: "#388e3c", margin: "0 0 5px 0" }}>{orderStats.deliveredOrders}</h4>
                <p style={{ color: "#666", margin: 0, fontSize: "12px" }}>Delivered</p>
              </div>
            </div>

            {orderStats.recentOrders.length > 0 ? (
              <div>
                {orderStats.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "20px",
                      marginBottom: "15px",
                      backgroundColor: "#fafafa"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                      <div>
                        <h4 style={{ color: "#333", margin: "0 0 5px 0" }}>{order.orderId}</h4>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Ordered on {formatDate(order.createdAt)}
                        </div>
                        {order.estimatedDelivery && (
                          <div style={{ fontSize: "12px", color: "#007bff", marginTop: "2px" }}>
                            Estimated delivery: {formatDate(order.estimatedDelivery)}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            backgroundColor: getStatusColor(order.status),
                            color: "white",
                            padding: "6px 15px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}
                        >
                          {getStatusIcon(order.status)} {order.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginTop: "8px" }}>
                          {formatCurrency(order.orderSummary.totalAmount)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <strong>Items:</strong>
                      <div style={{ marginTop: "5px" }}>
                        {order.items.map((item, index) => (
                          <div key={index} style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            padding: "5px 0",
                            borderBottom: index < order.items.length - 1 ? "1px solid #eee" : "none"
                          }}>
                            <span>{item.productName} (x{item.quantity})</span>
                            <span>{formatCurrency(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div style={{
                        backgroundColor: "#e3f2fd",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #bbdefb"
                      }}>
                        <strong style={{ color: "#1976d2" }}>Tracking Number:</strong> {order.trackingNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                <h3>No orders yet</h3>
                <p>When you place orders, they will appear here.</p>
                <button
                  onClick={() => navigate("/products")}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  🛍️ Start Shopping
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ color: "#28a745", margin: 0 }}>My Messages</h2>
              <button
                onClick={() => navigate("/contact-us")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                📧 Send New Message
              </button>
            </div>

            {/* Message Statistics */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
              gap: "15px", 
              marginBottom: "30px" 
            }}>
              <div style={{
                padding: "15px",
                backgroundColor: "#fff3e0",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #ffcc02"
              }}>
                <h4 style={{ color: "#f57c00", margin: "0 0 5px 0" }}>{userStats.pendingContacts}</h4>
                <p style={{ color: "#666", margin: 0, fontSize: "12px" }}>Pending</p>
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: "#cfe2ff",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #9ec5fe"
              }}>
                <h4 style={{ color: "#084298", margin: "0 0 5px 0" }}>{userStats.inProgressContacts}</h4>
                <p style={{ color: "#666", margin: 0, fontSize: "12px" }}>In Progress</p>
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: "#e8f5e8",
                borderRadius: "6px",
                textAlign: "center",
                border: "1px solid #c8e6c9"
              }}>
                <h4 style={{ color: "#388e3c", margin: "0 0 5px 0" }}>{userStats.resolvedContacts}</h4>
                <p style={{ color: "#666", margin: 0, fontSize: "12px" }}>Resolved</p>
              </div>
            </div>

            {contactHistory.length > 0 ? (
              <div>
                {contactHistory.map((contact) => (
                  <div
                    key={contact._id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "20px",
                      marginBottom: "15px",
                      backgroundColor: "#fafafa"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                      <div>
                        <h4 style={{ color: "#333", margin: "0 0 5px 0" }}>{contact.subject}</h4>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Submitted on {formatDate(contact.createdAt)}
                        </div>
                      </div>
                      <span
                        style={{
                          backgroundColor: getStatusColor(contact.status),
                          color: "white",
                          padding: "6px 15px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        {getStatusIcon(contact.status)} {contact.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <strong>Message:</strong>
                      <div style={{
                        backgroundColor: "white",
                        padding: "10px",
                        borderRadius: "4px",
                        marginTop: "5px",
                        border: "1px solid #eee",
                        whiteSpace: "pre-wrap"
                      }}>
                        {contact.message}
                      </div>
                    </div>

                    {contact.adminResponse && (
                      <div style={{
                        backgroundColor: "#e8f5e8",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #c8e6c9"
                      }}>
                        <strong style={{ color: "#155724" }}>Admin Response:</strong>
                        <div style={{ marginTop: "5px", color: "#155724" }}>
                          {contact.adminResponse}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                <h3>No messages sent yet</h3>
                <p>When you contact us, your messages will appear here.</p>
                <button
                  onClick={() => navigate("/contact-us")}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Send Your First Message
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ color: "#28a745", margin: 0 }}>My Profile</h2>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {updateMessage && (
              <div style={{
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                backgroundColor: updateMessage.includes('successfully') ? "#d4edda" : "#f8d7da",
                color: updateMessage.includes('successfully') ? "#155724" : "#721c24",
                border: `1px solid ${updateMessage.includes('successfully') ? "#c3e6cb" : "#f5c6cb"}`
              }}>
                {updateMessage}
              </div>
            )}

            {editingProfile ? (
              <form onSubmit={updateProfile}>
                <div style={{ maxWidth: "500px" }}>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                      Name:
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                      Email:
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                      Phone:
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProfile(false);
                        setUpdateMessage('');
                        setProfileData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || ''
                        });
                      }}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{ maxWidth: "500px" }}>
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                  <strong>Name:</strong> {user.name || 'Not provided'}
                </div>
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                  <strong>Email:</strong> {user.email}
                </div>
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                  <strong>Phone:</strong> {user.phone || 'Not provided'}
                </div>
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                  <strong>Role:</strong> <span style={{ color: "#28a745", fontWeight: "bold" }}>{user.role}</span>
                </div>
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                  <strong>Member Since:</strong> {formatDate(user.createdAt || new Date())}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ color: "#28a745", marginBottom: "25px" }}>Account Settings</h2>
            
            <div style={{ maxWidth: "600px" }}>
              {/* Password Change Section */}
              <div style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <h4 style={{ color: "#333", marginBottom: "15px" }}>Change Password</h4>
                
                {passwordMessage && (
                  <div style={{
                    padding: "10px",
                    marginBottom: "15px",
                    borderRadius: "4px",
                    backgroundColor: passwordMessage.includes('successfully') ? "#d4edda" : "#f8d7da",
                    color: passwordMessage.includes('successfully') ? "#155724" : "#721c24",
                    border: `1px solid ${passwordMessage.includes('successfully') ? "#c3e6cb" : "#f5c6cb"}`
                  }}>
                    {passwordMessage}
                  </div>
                )}

                {changingPassword ? (
                  <form onSubmit={changePassword}>
                    <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                        Current Password:
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "4px"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                        New Password:
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "4px"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                        Confirm New Password:
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "4px"
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="submit"
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Change Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordMessage('');
                        }}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p style={{ color: "#666", marginBottom: "15px" }}>
                      Update your account password for better security.
                    </p>
                    <button
                      onClick={() => setChangingPassword(true)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>

              {/* Email Preferences */}
              <div style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <h4 style={{ color: "#333", marginBottom: "15px" }}>Email Preferences</h4>
                <p style={{ color: "#666", marginBottom: "15px" }}>
                  You'll receive email notifications when we respond to your messages and for order updates.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="checkbox" defaultChecked disabled />
                  <label style={{ color: "#666" }}>Email notifications (always enabled)</label>
                </div>
              </div>

              {/* Account Information */}
              <div style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <h4 style={{ color: "#333", marginBottom: "15px" }}>Account Information</h4>
                <div style={{ color: "#666", marginBottom: "10px" }}>
                  <strong>Account Type:</strong> Customer Account
                </div>
                <div style={{ color: "#666", marginBottom: "10px" }}>
                  <strong>Member Since:</strong> {formatDate(user.createdAt || new Date())}
                </div>
                <div style={{ color: "#666", marginBottom: "15px" }}>
                  <strong>Status:</strong> <span style={{ color: "#28a745" }}>Active</span>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{
                padding: "20px",
                border: "1px solid #ffcccb",
                borderRadius: "8px",
                backgroundColor: "#fff5f5"
              }}>
                <h4 style={{ color: "#dc3545", marginBottom: "15px" }}>Danger Zone</h4>
                <p style={{ color: "#666", marginBottom: "15px" }}>
                  Account deletion is permanent and cannot be undone. Contact support if you need help.
                </p>
                <button
                  onClick={() => alert("Please contact support to delete your account.")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Request Account Deletion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}