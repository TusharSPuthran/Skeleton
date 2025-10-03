import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  });
  const [trackingData, setTrackingData] = useState({
    trackingNumber: '',
    cancellationReason: ''
  });
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 15,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await axios.get(
        `http://localhost:7000/admin/admin/orders?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
        setStats(response.data.stats);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      const token = localStorage.getItem("authToken");
      const updateData = { 
        status: newStatus,
        ...(newStatus === 'shipped' && trackingData.trackingNumber && { 
          trackingNumber: trackingData.trackingNumber 
        }),
        ...(newStatus === 'cancelled' && trackingData.cancellationReason && { 
          cancellationReason: trackingData.cancellationReason 
        })
      };

      const response = await axios.put(
        `http://localhost:7000/admin/admin/orders/${orderId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        fetchOrders();
        setSelectedOrder(null);
        setTrackingData({ trackingNumber: '', cancellationReason: '' });
        alert(`Order status updated to ${newStatus} successfully!`);
      } else {
        alert(response.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    } finally {
      setUpdatingOrder(null);
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

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': '#ffc107',
      'paid': '#28a745',
      'failed': '#dc3545',
      'refunded': '#6c757d'
    };
    return colors[status] || '#6c757d';
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#007bff", margin: 0 }}>Order Management</h1>
        <button
          onClick={() => navigate("/admin-home")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

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
          border: "1px solid #bbdefb",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#1976d2", fontSize: "24px", margin: "0 0 5px 0" }}>
            {stats.totalOrders}
          </h3>
          <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Total Orders</p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#e8f5e8",
          borderRadius: "8px",
          border: "1px solid #c8e6c9",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#388e3c", fontSize: "24px", margin: "0 0 5px 0" }}>
            {formatCurrency(stats.totalRevenue)}
          </h3>
          <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Total Revenue</p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#fff3e0",
          borderRadius: "8px",
          border: "1px solid #ffcc02",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#f57c00", fontSize: "24px", margin: "0 0 5px 0" }}>
            {stats.pendingOrders}
          </h3>
          <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Pending</p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#f3e5f5",
          borderRadius: "8px",
          border: "1px solid #ce93d8",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#8e24aa", fontSize: "24px", margin: "0 0 5px 0" }}>
            {stats.shippedOrders}
          </h3>
          <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Shipped</p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#e8f5e8",
          borderRadius: "8px",
          border: "1px solid #c8e6c9",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#388e3c", fontSize: "24px", margin: "0 0 5px 0" }}>
            {stats.deliveredOrders}
          </h3>
          <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Delivered</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        marginBottom: "20px"
      }}>
        <h3 style={{ color: "#333", marginBottom: "15px" }}>Filters</h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px" 
        }}>
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({...filters, status: e.target.value});
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Payment Status:</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => {
                setFilters({...filters, paymentStatus: e.target.value});
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Search:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters({...filters, search: e.target.value});
                setCurrentPage(1);
              }}
              placeholder="Order ID or customer name..."
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Date Range:</label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({...filters, startDate: e.target.value});
                  setCurrentPage(1);
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({...filters, endDate: e.target.value});
                  setCurrentPage(1);
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFilters({
              status: '',
              paymentStatus: '',
              startDate: '',
              endDate: '',
              search: ''
            });
            setCurrentPage(1);
          }}
          style={{
            marginTop: "15px",
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Orders Table */}
      <div style={{ backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f8f9fa" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Order Details
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Customer
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Amount
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Status
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Payment
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Date
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "15px" }}>
                  <div>
                    <strong style={{ color: "#007bff" }}>{order.orderId}</strong>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                      {order.items.length} item(s)
                    </div>
                    {order.trackingNumber && (
                      <div style={{ fontSize: "12px", color: "#28a745", marginTop: "2px" }}>
                        Tracking: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <div style={{ fontSize: "14px" }}>{order.shippingAddress.fullName}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{order.userId?.email}</div>
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <strong>{formatCurrency(order.orderSummary.totalAmount)}</strong>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {order.paymentMethod.toUpperCase()}
                  </div>
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    backgroundColor: getStatusColor(order.status),
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "capitalize"
                  }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    backgroundColor: getPaymentStatusColor(order.paymentStatus),
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "capitalize"
                  }}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td style={{ padding: "15px", textAlign: "center", fontSize: "12px", color: "#666" }}>
                  {formatDate(order.createdAt)}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button
                    onClick={() => {
                      setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order);
                      setTrackingData({ trackingNumber: order.trackingNumber || '', cancellationReason: '' });
                    }}
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
                    {selectedOrder?.orderId === order.orderId ? "Close" : "Manage"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <p>No orders found matching the current filters.</p>
          </div>
        )}
      </div>

      {/* Order Management Panel */}
      {selectedOrder && (
        <div style={{
          marginTop: "20px",
          backgroundColor: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "25px"
        }}>
          <h3 style={{ color: "#007bff", marginBottom: "20px" }}>
            Manage Order: {selectedOrder.orderId}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "25px" }}>
            {/* Order Items */}
            <div>
              <h4 style={{ color: "#333", marginBottom: "15px" }}>Order Items</h4>
              <div style={{ border: "1px solid #eee", borderRadius: "6px", padding: "15px" }}>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    padding: "10px 0",
                    borderBottom: index < selectedOrder.items.length - 1 ? "1px solid #eee" : "none"
                  }}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{item.productName}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>{formatCurrency(item.price)} each</div>
                      <div style={{ fontWeight: "bold" }}>{formatCurrency(item.total)}</div>
                    </div>
                  </div>
                ))}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginTop: "15px",
                  paddingTop: "15px",
                  borderTop: "2px solid #007bff",
                  fontWeight: "bold",
                  fontSize: "16px"
                }}>
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.orderSummary.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h4 style={{ color: "#333", marginBottom: "15px" }}>Shipping Address</h4>
              <div style={{ border: "1px solid #eee", borderRadius: "6px", padding: "15px" }}>
                <div style={{ marginBottom: "8px" }}><strong>{selectedOrder.shippingAddress.fullName}</strong></div>
                <div style={{ marginBottom: "8px" }}>{selectedOrder.shippingAddress.addressLine1}</div>
                {selectedOrder.shippingAddress.addressLine2 && (
                  <div style={{ marginBottom: "8px" }}>{selectedOrder.shippingAddress.addressLine2}</div>
                )}
                <div style={{ marginBottom: "8px" }}>
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                </div>
                <div style={{ marginBottom: "8px" }}>Phone: {selectedOrder.shippingAddress.phone}</div>
                {selectedOrder.shippingAddress.landmark && (
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Landmark: {selectedOrder.shippingAddress.landmark}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Update Actions */}
          <div>
            <h4 style={{ color: "#333", marginBottom: "15px" }}>Update Order Status</h4>
            
            {/* Tracking Number Input for Shipped Status */}
            {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped') && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Tracking Number:
                </label>
                <input
                  type="text"
                  value={trackingData.trackingNumber}
                  onChange={(e) => setTrackingData({...trackingData, trackingNumber: e.target.value})}
                  placeholder="Enter tracking number for shipping"
                  style={{
                    width: "300px",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>
            )}

            {/* Cancellation Reason Input */}
            {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Cancellation Reason (if cancelling):
                </label>
                <textarea
                  value={trackingData.cancellationReason}
                  onChange={(e) => setTrackingData({...trackingData, cancellationReason: e.target.value})}
                  placeholder="Enter reason for cancellation..."
                  rows="2"
                  style={{
                    width: "300px",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Status transition buttons */}
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.orderId, 'confirmed')}
                  disabled={updatingOrder === selectedOrder.orderId}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: updatingOrder === selectedOrder.orderId ? "not-allowed" : "pointer"
                  }}
                >
                  Confirm Order
                </button>
              )}

              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.orderId, 'processing')}
                  disabled={updatingOrder === selectedOrder.orderId}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#fd7e14",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: updatingOrder === selectedOrder.orderId ? "not-allowed" : "pointer"
                  }}
                >
                  Start Processing
                </button>
              )}

              {selectedOrder.status === 'processing' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.orderId, 'shipped')}
                  disabled={updatingOrder === selectedOrder.orderId}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6f42c1",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: updatingOrder === selectedOrder.orderId ? "not-allowed" : "pointer"
                  }}
                >
                  Mark as Shipped
                </button>
              )}

              {selectedOrder.status === 'shipped' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.orderId, 'delivered')}
                  disabled={updatingOrder === selectedOrder.orderId}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: updatingOrder === selectedOrder.orderId ? "not-allowed" : "pointer"
                  }}
                >
                  Mark as Delivered
                </button>
              )}

              {/* Cancel button (available for most statuses except delivered) */}
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.orderId, 'cancelled')}
                  disabled={updatingOrder === selectedOrder.orderId || !trackingData.cancellationReason.trim()}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: (updatingOrder === selectedOrder.orderId || !trackingData.cancellationReason.trim()) ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel Order
                </button>
              )}
            </div>

            {selectedOrder.cancellationReason && (
              <div style={{
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
                borderRadius: "4px",
                color: "#721c24"
              }}>
                <strong>Cancellation Reason:</strong> {selectedOrder.cancellationReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "30px", gap: "10px" }}>
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
    </div>
  );
}