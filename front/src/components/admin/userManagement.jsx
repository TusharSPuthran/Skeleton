import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUser, setUpdatingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axios.get(
        `http://localhost:7000/admin/users?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    setUpdatingUser(userId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `http://localhost:7000/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        fetchUsers(); // Refresh the list
        alert(`User role updated to ${newRole} successfully!`);
      } else {
        alert(response.data.message || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    } finally {
      setUpdatingUser(null);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `http://localhost:7000/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        fetchUsers(); // Refresh the list
        alert("User deleted successfully!");
      } else {
        alert(response.data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#007bff", margin: 0 }}>User Management</h1>
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

      {/* Filters and Search */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        marginBottom: "20px", 
        flexWrap: "wrap",
        alignItems: "center" 
      }}>
        <div>
          <label style={{ fontWeight: "bold", marginRight: "8px" }}>Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: "bold", marginRight: "8px" }}>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name or email..."
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              width: "250px"
            }}
          />
        </div>

        <div style={{ marginLeft: "auto" }}>
          <span style={{ color: "#666", fontSize: "14px" }}>
            Total Users: <strong>{users.length}</strong>
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f8f9fa" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Name
              </th>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Email
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Role
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Registered
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "15px" }}>
                  <strong>{user.name}</strong>
                </td>
                <td style={{ padding: "15px", color: "#666" }}>
                  {user.email}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <span
                    style={{
                      backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textTransform: "uppercase"
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: "15px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                  {formatDate(user.createdAt)}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                    {/* Role Change Buttons */}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => updateUserRole(user._id, 'admin')}
                        disabled={updatingUser === user._id}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: updatingUser === user._id ? "#6c757d" : "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: updatingUser === user._id ? "not-allowed" : "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Make Admin
                      </button>
                    )}
                    
                    {user.role !== 'client' && (
                      <button
                        onClick={() => updateUserRole(user._id, 'client')}
                        disabled={updatingUser === user._id}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: updatingUser === user._id ? "#6c757d" : "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: updatingUser === user._id ? "not-allowed" : "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Make Client
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => setShowDeleteConfirm(user._id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <p>No users found matching the current filters.</p>
          </div>
        )}
      </div>

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
            maxWidth: "400px",
            width: "90%"
          }}>
            <h3 style={{ color: "#dc3545", marginBottom: "15px" }}>Confirm Delete</h3>
            <p style={{ marginBottom: "20px" }}>
              Are you sure you want to delete this user? This action cannot be undone and will also delete all their contact messages.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
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
              <button
                onClick={() => deleteUser(showDeleteConfirm)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}