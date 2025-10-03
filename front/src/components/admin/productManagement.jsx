import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockNotifications, setStockNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    stock: '',
    sku: '',
    images: [''],
    specifications: [{ key: '', value: '' }],
    tags: [''],
    discount: { percentage: 0 }
  });
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchStockNotifications();
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const response = await axios.get(
        `http://localhost:7000/admin/products?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setProducts(response.data.products);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        "http://localhost:7000/admin/stock-notifications",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setStockNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching stock notifications:", error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');

    try {
      const token = localStorage.getItem("authToken");
      const url = editingProduct 
        ? `http://localhost:7000/admin/products/${editingProduct._id}`
        : "http://localhost:7000/admin/products";
      
      const method = editingProduct ? 'PUT' : 'POST';

      // Clean up form data
      const formData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        images: productForm.images.filter(img => img.trim() !== ''),
        specifications: productForm.specifications.filter(spec => spec.key && spec.value),
        tags: productForm.tags.filter(tag => tag.trim() !== '')
      };

      const response = await axios({
        method: method,
        url: url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFormMessage(`Product ${editingProduct ? 'updated' : 'added'} successfully!`);
        setTimeout(() => {
          setShowAddForm(false);
          setEditingProduct(null);
          resetForm();
          fetchProducts();
        }, 1500);
      } else {
        setFormMessage(response.data.message || `Failed to ${editingProduct ? 'update' : 'add'} product`);
      }
    } catch (error) {
      setFormMessage(`Error ${editingProduct ? 'updating' : 'adding'} product`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      brand: product.brand || '',
      stock: product.stock.toString(),
      sku: product.sku,
      images: product.images.length > 0 ? product.images : [''],
      specifications: product.specifications.length > 0 ? product.specifications : [{ key: '', value: '' }],
      tags: product.tags.length > 0 ? product.tags : [''],
      discount: product.discount || { percentage: 0 }
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `http://localhost:7000/admin/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        fetchProducts();
      } else {
        alert(response.data.message || "Failed to delete product");
      }
    } catch (error) {
      alert("Error deleting product");
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      brand: '',
      stock: '',
      sku: '',
      images: [''],
      specifications: [{ key: '', value: '' }],
      tags: [''],
      discount: { percentage: 0 }
    });
    setFormMessage('');
  };

  const addArrayField = (fieldName) => {
    setProductForm(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], fieldName === 'specifications' ? { key: '', value: '' } : '']
    }));
  };

  const updateArrayField = (fieldName, index, value, subField = null) => {
    setProductForm(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) => {
        if (i === index) {
          return subField ? { ...item, [subField]: value } : value;
        }
        return item;
      })
    }));
  };

  const removeArrayField = (fieldName, index) => {
    setProductForm(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#007bff", margin: 0 }}>Product Management</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              padding: "10px 15px",
              backgroundColor: "#ffc107",
              color: "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            🔔 Stock Requests ({stockNotifications.length})
          </button>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingProduct(null);
              resetForm();
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            + Add Product
          </button>
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
            ← Back
          </button>
        </div>
      </div>

      {/* Stock Notifications Panel */}
      {showNotifications && (
        <div style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3 style={{ color: "#856404", marginBottom: "15px" }}>Stock Notification Requests</h3>
          {stockNotifications.length > 0 ? (
            stockNotifications.map((notification, index) => (
              <div key={index} style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "10px",
                border: "1px solid #ffd93d"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                  {notification.product.name}
                </h4>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  <strong>Current Stock:</strong> {notification.product.stock} units
                </p>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  <strong>Requests:</strong> {notification.requests.length} users waiting
                </p>
                <div style={{ marginTop: "10px" }}>
                  <strong>Users:</strong>
                  {notification.requests.slice(0, 3).map((request, i) => (
                    <span key={i} style={{ 
                      display: "inline-block", 
                      backgroundColor: "#e9ecef", 
                      padding: "2px 8px", 
                      borderRadius: "4px", 
                      margin: "2px", 
                      fontSize: "12px" 
                    }}>
                      {request.user.name}
                    </span>
                  ))}
                  {notification.requests.length > 3 && (
                    <span style={{ color: "#666", fontSize: "12px" }}>
                      +{notification.requests.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#856404", fontStyle: "italic" }}>
              No stock notification requests at the moment.
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        marginBottom: "20px", 
        flexWrap: "wrap",
        alignItems: "center" 
      }}>
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search products..."
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              width: "250px"
            }}
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Home">Home</option>
            <option value="Sports">Sports</option>
          </select>
        </div>
      </div>

      {/* Add/Edit Product Form */}
      {showAddForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          zIndex: 1000,
          overflowY: "auto",
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginBottom: "20px" }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>

            {formMessage && (
              <div style={{
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                backgroundColor: formMessage.includes('successfully') ? "#d4edda" : "#f8d7da",
                color: formMessage.includes('successfully') ? "#155724" : "#721c24",
                border: `1px solid ${formMessage.includes('successfully') ? "#c3e6cb" : "#f5c6cb"}`
              }}>
                {formMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {/* Basic Information */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Description *
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  required
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    required
                    min="0"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Books">Books</option>
                    <option value="Home">Home</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  SKU *
                </label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                  required
                  placeholder="Unique product identifier"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>

              {/* Images */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Product Images (URLs)
                </label>
                {productForm.images.map((image, index) => (
                  <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => updateArrayField('images', index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      style={{
                        flex: 1,
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('images', index)}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('images')}
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
                  Add Image
                </button>
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    resetForm();
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
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div style={{ backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f8f9fa" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Product
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Price
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Stock
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Category
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Status
              </th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "15px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {product.images[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div>
                      <strong>{product.name}</strong>
                      <div style={{ fontSize: "12px", color: "#666" }}>SKU: {product.sku}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  ₹{product.price.toFixed(2)}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: product.stock > 0 ? "#d4edda" : "#f8d7da",
                    color: product.stock > 0 ? "#155724" : "#721c24",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {product.stock}
                  </span>
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  {product.category}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: product.status === 'active' ? "#d4edda" : "#f8d7da",
                    color: product.status === 'active' ? "#155724" : "#721c24",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textTransform: "capitalize"
                  }}>
                    {product.status}
                  </span>
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                    <button
                      onClick={() => handleEdit(product)}
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
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
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

        {products.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <p>No products found.</p>
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
    </div>
  );
}