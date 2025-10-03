import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchOrders();
  }, [currentPage, statusFilter]);

  const checkAuthAndFetchOrders = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    await fetchOrders();
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter })
      });

      const response = await axios.get(
        `http://localhost:7000/admin/orders?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
      } else {
        setMessage('Failed to load orders');
        setMessageType('error');
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setMessage('Error loading orders');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!cancelReason.trim()) {
      setMessage('Please provide a reason for cancellation');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return;
    }

    setCancelling(orderId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `http://localhost:7000/admin/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: cancelReason }
        }
      );

      if (response.data.success) {
        setMessage('Order cancelled successfully');
        setMessageType('success');
        setShowCancelModal(false);
        setCancelReason('');
        fetchOrders(); // Refresh orders
      } else {
        setMessage(response.data.message || 'Failed to cancel order');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error cancelling order');
      setMessageType('error');
    } finally {
      setCancelling(null);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ffc107',
      'confirmed': '#17a2b8',
      'processing': '#fd7e14',
      'shipped': '#6f42c1',
      'delivered': '#28a745',
      'cancelled': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '📋',
      'processing': '⚙️',
      'shipped': '🚚',
      'delivered': '📦',
      'cancelled': '❌'
    };
    return icons[status] || '❓';
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
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

  const canCancelOrder = (order) => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  const trackOrder = (order) => {
    if (order.trackingNumber) {
      // In a real application, this would link to a tracking service
      alert(`Tracking Number: ${order.trackingNumber}\n\nYou can track your order using this tracking number on our logistics partner's website.`);
    } else {
      alert('Tracking information will be available once your order is shipped.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading your orders...</p>
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
          <h1 style={{ color: "#28a745", margin: "0 0 5px 0" }}>My Orders</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Track and manage your orders
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
            Continue Shopping
          </button>
          <button
            onClick={() => navigate("/client-home")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "4px",
          backgroundColor: messageType === 'success' ? "#d4edda" : "#f8d7da",
          color: messageType === 'success' ? "#155724" : "#721c24",
          border: `1px solid ${messageType === 'success' ? "#c3e6cb" : "#f5c6cb"}`,
          textAlign: "center"
        }}>
          {message}
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "15px"
      }}>
        <label style={{ fontWeight: "bold" }}>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px"
          }}
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span style={{ marginLeft: "auto", color: "#666" }}>
          {orders.length} order(s) found
        </span>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "20px",
                backgroundColor: "white",
                overflow: "hidden"
              }}
            >
              {/* Order Header */}
              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "15px 20px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h3 style={{ color: "#333", margin: "0 0 5px 0" }}>
                    Order #{order.orderId}
                  </h3>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    Placed on {formatDate(order.createdAt)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      backgroundColor: getStatusColor(order.status),
                      color: "white",
                      padding: "6px 15px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textTransform: "capitalize"
                    }}
                  >
                    {getStatusIcon(order.status)} {order.status}
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "5px" }}>
                    {formatCurrency(order.orderSummary.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div style={{ padding: "20px" }}>
                {/* Order Items */}
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ color: "#333", marginBottom: "10px" }}>Items Ordered:</h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "10px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "6px"
                        }}
                      >
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              marginRight: "15px"
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", color: "#333" }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: "14px", color: "#666" }}>
                            Quantity: {item.quantity} × {formatCurrency(item.price)}
                          </div>
                        </div>
                        <div style={{ fontWeight: "bold" }}>
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Information */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "15px" }}>
                  <div>
                    <h4 style={{ color: "#333", marginBottom: "8px" }}>Delivery Address:</h4>
                    <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}>
                      {order.shippingAddress.fullName}<br />
                      {order.shippingAddress.addressLine1}<br />
                      {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                      Phone: {order.shippingAddress.phone}
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ color: "#333", marginBottom: "8px" }}>Order Details:</h4>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      <div>Payment: {order.paymentMethod.toUpperCase()}</div>
                      <div>Payment Status: 
                        <span style={{ 
                          color: order.paymentStatus === 'paid' ? '#28a745' : '#ffc107',
                          fontWeight: 'bold',
                          marginLeft: '5px'
                        }}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                      {order.estimatedDelivery && (
                        <div>Est. Delivery: {formatDate(order.estimatedDelivery)}</div>
                      )}
                      {order.trackingNumber && (
                        <div>Tracking: {order.trackingNumber}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {order.orderNotes && (
                  <div style={{ marginBottom: "15px" }}>
                    <h4 style={{ color: "#333", marginBottom: "8px" }}>Order Notes:</h4>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#666",
                      backgroundColor: "#f8f9fa",
                      padding: "10px",
                      borderRadius: "4px"
                    }}>
                      {order.orderNotes}
                    </div>
                  </div>
                )}

                {/* Cancellation Reason */}
                {order.status === 'cancelled' && order.cancellationReason && (
                  <div style={{ marginBottom: "15px" }}>
                    <h4 style={{ color: "#dc3545", marginBottom: "8px" }}>Cancellation Reason:</h4>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#721c24",
                      backgroundColor: "#f8d7da",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #f5c6cb"
                    }}>
                      {order.cancellationReason}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  {order.status === 'shipped' || order.status === 'delivered' ? (
                    <button
                      onClick={() => trackOrder(order)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      Track Order
                    </button>
                  ) : null}

                  {canCancelOrder(order) && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowCancelModal(true);
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      Cancel Order
                    </button>
                  )}

                  <button
                    onClick={() => navigate("/products")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Buy Again
                  </button>

                  <button
                    onClick={() => navigate("/contact-us")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Need Help?
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📦</div>
          <h2 style={{ color: "#666", marginBottom: "15px" }}>No orders found</h2>
          <p style={{ color: "#999", marginBottom: "30px" }}>
            {statusFilter 
              ? `No orders with status "${statusFilter}" found.`
              : "You haven't placed any orders yet."
            }
          </p>
          <button
            onClick={() => navigate("/products")}
            style={{
              padding: "15px 30px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            Start Shopping
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          gap: "10px",
          marginTop: "30px"
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              backgroundColor: currentPage === 1 ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer"
            }}
          >
            Previous
          </button>

          <span style={{ padding: "8px 16px", backgroundColor: "#e9ecef", borderRadius: "4px" }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              backgroundColor: currentPage === totalPages ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "500px"
          }}>
            <h3 style={{ color: "#dc3545", marginBottom: "15px" }}>Cancel Order</h3>
            <p style={{ marginBottom: "15px", color: "#666" }}>
              Are you sure you want to cancel order #{selectedOrder.orderId}?
            </p>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                Reason for cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this order..."
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedOrder(null);
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
                Keep Order
              </button>
              <button
                onClick={() => cancelOrder(selectedOrder.orderId)}
                disabled={cancelling === selectedOrder.orderId || !cancelReason.trim()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: (cancelling === selectedOrder.orderId || !cancelReason.trim()) ? "#6c757d" : "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: (cancelling === selectedOrder.orderId || !cancelReason.trim()) ? "not-allowed" : "pointer"
                }}
              >
                {cancelling === selectedOrder.orderId ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}