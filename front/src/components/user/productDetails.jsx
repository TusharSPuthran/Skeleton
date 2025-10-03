import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    checkAuthentication();
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  const checkAuthentication = () => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:7000/admin/products/${productId}`);
      
      if (response.data.success) {
        setProduct(response.data.product);
      } else {
        setMessage('Product not found');
        setMessageType('error');
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setMessage('Error loading product');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await axios.get(
        `http://localhost:7000/admin/products?category=${product.category}&limit=4`
      );
      
      if (response.data.success) {
        // Filter out current product from related products
        const filtered = response.data.products.filter(p => p._id !== product._id);
        setRelatedProducts(filtered.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setAddingToCart(true);
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
        setMessage(`${quantity} item(s) added to cart successfully!`);
        setMessageType('success');
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
      } else {
        setMessage(response.data.message || 'Failed to add product to cart');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding product to cart');
      setMessageType('error');
    } finally {
      setAddingToCart(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  const requestStockNotification = async () => {
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
        setMessage('You will be notified when this product is back in stock!');
        setMessageType('success');
      } else {
        setMessage(response.data.message || 'Failed to set up stock notification');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error setting up stock notification');
      setMessageType('error');
    }
    
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const buyNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // Add to cart first, then navigate to checkout
    addToCart().then(() => {
      if (product.stock >= quantity) {
        navigate("/checkout");
      }
    });
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
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist.</p>
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
          Back to Products
        </button>
      </div>
    );
  }

  const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
  const hasDiscount = product.discount && product.discount.percentage > 0;
  const savings = hasDiscount ? product.price - discountedPrice : 0;

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/products")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          ← Back to Products
        </button>
        
        {isAuthenticated && (
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
        )}
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

      {/* Product Main Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px" }}>
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div style={{ marginBottom: "15px" }}>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "400px",
                  objectFit: "cover",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='20'%3ENo Image Available%3C/text%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "400px",
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                border: "1px solid #ddd",
                borderRadius: "8px"
              }}>
                No Image Available
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: "flex", gap: "10px", overflowX: "auto" }}>
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  onClick={() => setSelectedImage(index)}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    border: selectedImage === index ? "2px solid #007bff" : "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 style={{ color: "#333", margin: "0 0 10px 0", fontSize: "28px" }}>
            {product.name}
          </h1>

          {/* Category and Brand */}
          <div style={{ marginBottom: "15px" }}>
            <span style={{
              display: "inline-block",
              backgroundColor: "#e9ecef",
              color: "#495057",
              padding: "4px 12px",
              borderRadius: "15px",
              fontSize: "14px",
              marginRight: "10px"
            }}>
              {product.category}
            </span>
            {product.brand && (
              <span style={{
                display: "inline-block",
                backgroundColor: "#cfe2ff",
                color: "#0a58ca",
                padding: "4px 12px",
                borderRadius: "15px",
                fontSize: "14px"
              }}>
                {product.brand}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.ratings && product.ratings.count > 0 && (
            <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ffc107", fontSize: "18px" }}>★</span>
                <span style={{ fontWeight: "bold" }}>{product.ratings.average.toFixed(1)}</span>
                <span style={{ color: "#666" }}>({product.ratings.count} reviews)</span>
              </div>
            </div>
          )}

          {/* Price */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
              <span style={{ fontSize: "32px", fontWeight: "bold", color: "#28a745" }}>
                {formatCurrency(discountedPrice)}
              </span>
              {hasDiscount && (
                <span style={{ 
                  fontSize: "20px", 
                  color: "#6c757d", 
                  textDecoration: "line-through" 
                }}>
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
            
            {hasDiscount && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}>
                  {product.discount.percentage}% OFF
                </span>
                <span style={{ color: "#28a745", fontWeight: "bold" }}>
                  You save {formatCurrency(savings)}
                </span>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div style={{ marginBottom: "20px" }}>
            {product.stock > 0 ? (
              <div>
                <span style={{ 
                  color: product.stock <= 5 ? "#dc3545" : "#28a745",
                  fontWeight: "bold",
                  fontSize: "16px"
                }}>
                  {product.stock <= 5 ? `Only ${product.stock} left in stock!` : `In Stock (${product.stock} available)`}
                </span>
              </div>
            ) : (
              <span style={{ color: "#dc3545", fontWeight: "bold", fontSize: "16px" }}>
                Currently Out of Stock
              </span>
            )}
          </div>

          {/* Quantity and Actions */}
          {product.stock > 0 ? (
            <div>
              {/* Quantity Selector */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                  Quantity:
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    -
                  </button>
                  <span style={{ 
                    padding: "8px 16px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    minWidth: "60px",
                    textAlign: "center"
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                <button
                  onClick={addToCart}
                  disabled={addingToCart}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: addingToCart ? "#6c757d" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: addingToCart ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}
                >
                  {addingToCart ? "Adding to Cart..." : "Add to Cart"}
                </button>
                
                <button
                  onClick={buyNow}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}
                >
                  Buy Now
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={requestStockNotification}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  backgroundColor: "#ffc107",
                  color: "black",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                Notify Me When Available
              </button>
            </div>
          )}

          {/* Product Meta */}
          <div style={{ 
            backgroundColor: "#f8f9fa",
            padding: "15px",
            borderRadius: "6px",
            fontSize: "14px"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>SKU:</strong> {product.sku}
            </div>
            {product.tags && product.tags.length > 0 && (
              <div>
                <strong>Tags:</strong> {product.tags.join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div style={{ marginBottom: "40px" }}>
        {/* Tab Navigation */}
        <div style={{ 
          display: "flex", 
          borderBottom: "2px solid #dee2e6", 
          marginBottom: "20px"
        }}>
          {[
            { id: 'description', label: 'Description' },
            { id: 'specifications', label: 'Specifications' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 24px",
                border: "none",
                backgroundColor: activeTab === tab.id ? "#007bff" : "transparent",
                color: activeTab === tab.id ? "white" : "#666",
                fontWeight: activeTab === tab.id ? "bold" : "normal",
                cursor: "pointer",
                borderRadius: activeTab === tab.id ? "6px 6px 0 0" : "0"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ 
          backgroundColor: "white", 
          border: "1px solid #dee2e6", 
          borderRadius: "0 6px 6px 6px", 
          padding: "20px" 
        }}>
          {activeTab === 'description' && (
            <div>
              <h3 style={{ color: "#333", marginBottom: "15px" }}>Product Description</h3>
              <p style={{ 
                color: "#666", 
                lineHeight: "1.6",
                fontSize: "16px",
                whiteSpace: "pre-wrap"
              }}>
                {product.description}
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div>
              <h3 style={{ color: "#333", marginBottom: "15px" }}>Specifications</h3>
              {product.specifications && product.specifications.length > 0 ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {product.specifications.map((spec, index) => (
                    <div 
                      key={index}
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "200px 1fr",
                        padding: "10px 0",
                        borderBottom: index < product.specifications.length - 1 ? "1px solid #eee" : "none"
                      }}
                    >
                      <span style={{ fontWeight: "bold", color: "#333" }}>
                        {spec.key}:
                      </span>
                      <span style={{ color: "#666" }}>
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  No specifications available for this product.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 style={{ color: "#333", marginBottom: "20px" }}>Related Products</h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "20px" 
          }}>
            {relatedProducts.map((relatedProduct) => {
              const relatedDiscountedPrice = calculateDiscountedPrice(relatedProduct.price, relatedProduct.discount);
              const relatedHasDiscount = relatedProduct.discount && relatedProduct.discount.percentage > 0;

              return (
                <div
                  key={relatedProduct._id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "white",
                    cursor: "pointer",
                    transition: "transform 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  onClick={() => navigate(`/products/${relatedProduct._id}`)}
                >
                  <div style={{ height: "150px", overflow: "hidden" }}>
                    {relatedProduct.images && relatedProduct.images[0] ? (
                      <img
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
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
                  </div>

                  <div style={{ padding: "15px" }}>
                    <h4 style={{ 
                      color: "#333", 
                      margin: "0 0 8px 0", 
                      fontSize: "14px",
                      fontWeight: "bold"
                    }}>
                      {relatedProduct.name}
                    </h4>

                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ 
                        fontSize: "16px", 
                        fontWeight: "bold", 
                        color: "#28a745" 
                      }}>
                        {formatCurrency(relatedDiscountedPrice)}
                      </span>
                      {relatedHasDiscount && (
                        <span style={{ 
                          fontSize: "12px", 
                          color: "#6c757d", 
                          textDecoration: "line-through",
                          marginLeft: "8px"
                        }}>
                          {formatCurrency(relatedProduct.price)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${relatedProduct._id}`);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}