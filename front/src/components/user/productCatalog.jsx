import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    inStock: false
  });
  const [categories] = useState([
    'Electronics',
    'Clothing',
    'Books',
    'Home',
    'Sports',
    'Beauty',
    'Automotive',
    'Health'
  ]);
  const [addingToCart, setAddingToCart] = useState(null);
  const [cartMessage, setCartMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
    fetchProducts();
  }, [currentPage, filters]);

  const checkAuthentication = () => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== false))
      });

      const response = await axios.get(
        `http://localhost:7000/admin/products?${queryParams}`
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

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setAddingToCart(productId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        "http://localhost:7000/admin/cart",
        { productId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCartMessage('Product added to cart successfully!');
        setTimeout(() => setCartMessage(''), 3000);
      } else {
        setCartMessage(response.data.message || 'Failed to add product to cart');
        setTimeout(() => setCartMessage(''), 3000);
      }
    } catch (error) {
      setCartMessage('Error adding product to cart');
      setTimeout(() => setCartMessage(''), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  const requestStockNotification = async (productId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        "http://localhost:7000/admin/stock-notifications",
        { productId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('You will be notified when this product is back in stock!');
      } else {
        alert(response.data.message || 'Failed to set up stock notification');
      }
    } catch (error) {
      alert('Error setting up stock notification');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      inStock: false
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const calculateDiscountedPrice = (price, discount) => {
    if (discount && discount.percentage > 0) {
      return price * (1 - discount.percentage / 100);
    }
    return price;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading products...</p>
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
          <h1 style={{ color: "#007bff", margin: "0 0 5px 0" }}>Product Catalog</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Discover our amazing collection of products
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/cart")}
                style={{
                  padding: "10px 20px",
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
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Login to Shop
            </button>
          )}
        </div>
      </div>

      {/* Cart Message */}
      {cartMessage && (
        <div style={{
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "4px",
          backgroundColor: cartMessage.includes('successfully') ? "#d4edda" : "#f8d7da",
          color: cartMessage.includes('successfully') ? "#155724" : "#721c24",
          border: `1px solid ${cartMessage.includes('successfully') ? "#c3e6cb" : "#f5c6cb"}`,
          textAlign: "center"
        }}>
          {cartMessage}
        </div>
      )}

      {/* Filters Section */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        marginBottom: "30px"
      }}>
        <h3 style={{ color: "#333", marginBottom: "15px" }}>Filter Products</h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px",
          marginBottom: "15px"
        }}>
          {/* Search */}
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Search:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search products..."
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Category:</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Min Price:</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="Min price"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Max Price:</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="Max price"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Sort By:</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
            />
            In Stock Only
          </label>

          <button
            onClick={clearFilters}
            style={{
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
      </div>

      {/* Products Grid */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "20px" 
        }}>
          <h2 style={{ color: "#333", margin: 0 }}>
            Products {filters.category && `in ${filters.category}`}
          </h2>
          <span style={{ color: "#666" }}>
            {products.length} products found
          </span>
        </div>

        {products.length > 0 ? (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
            gap: "25px" 
          }}>
            {products.map((product) => {
              const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
              const hasDiscount = product.discount && product.discount.percentage > 0;

              return (
                <div
                  key={product._id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  {/* Product Image */}
                  <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999"
                      }}>
                        No Image
                      </div>
                    )}

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}>
                        {product.discount.percentage}% OFF
                      </div>
                    )}

                    {/* Stock Status */}
                    {product.stock === 0 && (
                      <div style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}>
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: "15px" }}>
                    <h3 style={{ 
                      color: "#333", 
                      margin: "0 0 8px 0", 
                      fontSize: "16px",
                      fontWeight: "bold",
                      lineHeight: "1.3"
                    }}>
                      {product.name}
                    </h3>

                    <p style={{ 
                      color: "#666", 
                      margin: "0 0 10px 0", 
                      fontSize: "14px",
                      lineHeight: "1.4",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}>
                      {product.description}
                    </p>

                    {/* Category and Brand */}
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{
                        display: "inline-block",
                        backgroundColor: "#e9ecef",
                        color: "#495057",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        marginRight: "8px"
                      }}>
                        {product.category}
                      </span>
                      {product.brand && (
                        <span style={{
                          display: "inline-block",
                          backgroundColor: "#cfe2ff",
                          color: "#0a58ca",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px"
                        }}>
                          {product.brand}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ 
                          fontSize: "18px", 
                          fontWeight: "bold", 
                          color: "#28a745" 
                        }}>
                          {formatCurrency(discountedPrice)}
                        </span>
                        {hasDiscount && (
                          <span style={{ 
                            fontSize: "14px", 
                            color: "#6c757d", 
                            textDecoration: "line-through" 
                          }}>
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Info */}
                    <div style={{ marginBottom: "15px" }}>
                      {product.stock > 0 ? (
                        <span style={{ 
                          fontSize: "12px", 
                          color: product.stock <= 5 ? "#dc3545" : "#28a745",
                          fontWeight: "bold"
                        }}>
                          {product.stock <= 5 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#dc3545", fontWeight: "bold" }}>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      {product.stock > 0 ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product._id);
                            }}
                            disabled={addingToCart === product._id}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              backgroundColor: addingToCart === product._id ? "#6c757d" : "#007bff",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: addingToCart === product._id ? "not-allowed" : "pointer",
                              fontSize: "14px",
                              fontWeight: "bold"
                            }}
                          >
                            {addingToCart === product._id ? "Adding..." : "Add to Cart"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${product._id}`);
                            }}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "transparent",
                              color: "#007bff",
                              border: "1px solid #007bff",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "14px"
                            }}
                          >
                            View
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              requestStockNotification(product._id);
                            }}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              backgroundColor: "#ffc107",
                              color: "black",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "bold"
                            }}
                          >
                            Notify When Available
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${product._id}`);
                            }}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "transparent",
                              color: "#007bff",
                              border: "1px solid #007bff",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "14px"
                            }}
                          >
                            View
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search terms.</p>
            <button
              onClick={clearFilters}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

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

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: currentPage === pageNumber ? "#007bff" : "#e9ecef",
                  color: currentPage === pageNumber ? "white" : "#495057",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {pageNumber}
              </button>
            );
          })}

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

          <span style={{ 
            marginLeft: "15px",
            color: "#666",
            fontSize: "14px"
          }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}