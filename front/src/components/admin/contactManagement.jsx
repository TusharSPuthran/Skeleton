import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminContactManagement() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminResponse, setAdminResponse] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
  }, [currentPage, statusFilter]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await axios.get(
        `http://localhost:7000/admin/contact-messages?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setContacts(response.data.contacts);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `http://localhost:7000/admin/contact-messages/${contactId}`,
        { 
          status: newStatus,
          adminResponse: adminResponse.trim() || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh the contacts list
        fetchContacts();
        setSelectedContact(null);
        setAdminResponse('');
        alert("Contact status updated successfully!");
      }
    } catch (error) {
      console.error("Error updating contact status:", error);
      alert("Failed to update contact status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'in-progress': return '#17a2b8';
      case 'resolved': return '#28a745';
      default: return '#6c757d';
    }
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading contacts...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#007bff", margin: 0 }}>Contact Management</h1>
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

      {/* Filters */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "15px", alignItems: "center" }}>
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
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Contacts List */}
      <div style={{ display: "grid", gap: "15px" }}>
        {contacts.map((contact) => (
          <div
            key={contact._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              backgroundColor: selectedContact?._id === contact._id ? "#f8f9fa" : "white"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
                  <div>
                    <strong>Name:</strong> {contact.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {contact.email}
                  </div>
                  {contact.phone && (
                    <div>
                      <strong>Phone:</strong> {contact.phone}
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: "10px" }}>
                  <strong>Subject:</strong> {contact.subject}
                </div>
                
                <div style={{ marginBottom: "15px" }}>
                  <strong>Message:</strong>
                  <div style={{
                    backgroundColor: "#f8f9fa",
                    padding: "10px",
                    borderRadius: "4px",
                    marginTop: "5px",
                    whiteSpace: "pre-wrap"
                  }}>
                    {contact.message}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "#666" }}>
                  <div>Submitted: {formatDate(contact.createdAt)}</div>
                  {contact.userId?.name && <div>User: {contact.userId.name}</div>}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                <span
                  style={{
                    backgroundColor: getStatusColor(contact.status),
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "uppercase"
                  }}
                >
                  {contact.status.replace('-', ' ')}
                </span>

                <button
                  onClick={() => {
                    setSelectedContact(selectedContact?._id === contact._id ? null : contact);
                    setAdminResponse(contact.adminResponse || '');
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
                  {selectedContact?._id === contact._id ? "Close" : "Manage"}
                </button>
              </div>
            </div>

            {/* Admin Response Section */}
            {selectedContact?._id === contact._id && (
              <div style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#e9ecef",
                borderRadius: "4px"
              }}>
                <h4>Admin Actions</h4>
                
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Admin Response (Optional):
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px"
                    }}
                    placeholder="Add internal notes or response..."
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  {contact.status !== 'in-progress' && (
                    <button
                      onClick={() => updateContactStatus(contact._id, 'in-progress')}
                      disabled={updatingStatus}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: updatingStatus ? "not-allowed" : "pointer"
                      }}
                    >
                      Mark In Progress
                    </button>
                  )}
                  
                  {contact.status !== 'resolved' && (
                    <button
                      onClick={() => updateContactStatus(contact._id, 'resolved')}
                      disabled={updatingStatus}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: updatingStatus ? "not-allowed" : "pointer"
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}
                  
                  {contact.status !== 'pending' && (
                    <button
                      onClick={() => updateContactStatus(contact._id, 'pending')}
                      disabled={updatingStatus}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#ffc107",
                        color: "black",
                        border: "none",
                        borderRadius: "4px",
                        cursor: updatingStatus ? "not-allowed" : "pointer"
                      }}
                    >
                      Mark Pending
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {contacts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>No contact messages found for the selected filter.</p>
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