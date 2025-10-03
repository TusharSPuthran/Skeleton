import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ShoppingCart() {
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [discount, setDiscount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchCart();
  }, []);

  const checkAuthAndFetchCart = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    await fetchCart();
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get("http://localhost:7000/admin/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCart(response.data.cart);
      } else {
        setMessage('Failed to load cart');
        setMessageType('error');
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setMessage('Error loading cart');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setUpdating(productId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        "http://localhost:7000/admin/cart",
        { productId, quantity: newQuantity },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCart(response.data.cart);
        setMessage('Cart updated successfully');
        setMessageType('success');
      } else {
        setMessage(response.data.message || 'Failed to update cart');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error updating cart');
      setMessageType('error');
    } finally {
      setUpdating(null);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 2000);
    }
  };

  const removeFromCart = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }

    setUpdating(productId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `http://localhost:7000/admin/cart/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCart(response.data.cart);
        setMessage('Item removed from cart');
        setMessageType('success');
      } else {
        setMessage('Failed to remove item');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error removing item');
      setMessageType('error');
    } finally {
      setUpdating(null);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 2000);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setMessage('Please enter a promo code');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 2000);
      return;
    }

    setApplyingPromo(true);
    // Simulate promo code validation (you can implement actual backend endpoint)
    setTimeout(() => {
      const validCodes = {
        'SAVE10': 10,
        'WELCOME20': 20,
        'FIRST50': 50
      };

      if (validCodes[promoCode.toUpperCase()]) {
        const discountAmount = (cart.totalAmount * validCodes[promoCode.toUpperCase()]) / 100;
        setDiscount(discountAmount);
        setMessage(`Promo code applied! You saved ${formatCurrency(discountAmount)}`);
        setMessageType('success');
      } else {
        setMessage('Invalid promo code');
        setMessageType('error');
      }
      
      setApplyingPromo(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }, 1000);
  };

  const calculateShipping = (subtotal) => {
    return subtotal > 500 ? 0 : 50; // Free shipping above 500
  };

  const calculateTax = (subtotal) => {
    return subtotal * 0.18; // 18% GST
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      setMessage('Your cart is empty');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 2000);
      return;
    }
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading your cart...</p>
      </div>
    );
  }

  const subtotal = cart.totalAmount || 0;
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax - discount;

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
          <h1 style={{ color: "#28a745", margin: "0 0 5px 0" }}>Shopping Cart</h1>
          <p style={{ margin: 0, color: "#666" }}>
            {cart.totalItems || 0} item(s) in your cart
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

      {cart.items && cart.items.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
          {/* Cart Items */}
          <div>
            <h2 style={{ color: "#333", marginBottom: "20px" }}>Cart Items</h2>
            
            {cart.items.map((item) => (
              <div
                key={item.productId._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "15px",
                  backgroundColor: "white"
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "20px", alignItems: "center" }}>
                  {/* Product Image */}
                  <div>
                    {item.productId.images && item.productId.images[0] ? (
                      <img
                        src={item.productId.images[0]}
                        alt={item.productId.name}
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #ddd"
                        }}
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100px",
                        height: "100px",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        fontSize: "12px"
                      }}>
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div>
                    <h3 style={{ 
                      color: "#333", 
                      margin: "0 0 8px 0", 
                      fontSize: "18px",
                      cursor: "pointer"
                    }}
                    onClick={() => navigate(`/products/${item.productId._id}`)}
                    >
                      {item.productId.name}
                    </h3>
                    
                    <p style={{ 
                      color: "#666", 
                      margin: "0 0 10px 0", 
                      fontSize: "14px",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}>
                      {item.productId.description}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "bold", color: "#28a745" }}>
                        {formatCurrency(item.price)}
                      </span>
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        per item
                      </span>
                    </div>

                    {/* Stock Warning */}
                    {item.productId.stock <= 5 && (
                      <div style={{ 
                        color: "#dc3545", 
                        fontSize: "12px", 
                        fontWeight: "bold",
                        backgroundColor: "#f8d7da",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        display: "inline-block"
                      }}>
                        Only {item.productId.stock} left in stock!
                      </div>
                    )}
                  </div>

                  {/* Quantity and Actions */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ marginBottom: "15px" }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333", marginBottom: "5px" }}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Total for {item.quantity} item(s)
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                        disabled={updating === item.productId._id}
                        style={{
                          width: "30px",
                          height: "30px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: updating === item.productId._id ? "not-allowed" : "pointer",
                          fontSize: "16px"
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ 
                        minWidth: "40px",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: "bold"
                      }}>
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                        disabled={updating === item.productId._id || item.quantity >= item.productId.stock}
                        style={{
                          width: "30px",
                          height: "30px",
                          backgroundColor: (updating === item.productId._id || item.quantity >= item.productId.stock) ? "#6c757d" : "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: (updating === item.productId._id || item.quantity >= item.productId.stock) ? "not-allowed" : "pointer",
                          fontSize: "16px"
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.productId._id)}
                      disabled={updating === item.productId._id}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: updating === item.productId._id ? "not-allowed" : "pointer",
                        fontSize: "12px"
                      }}
                    >
                      {updating === item.productId._id ? "Updating..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              position: "sticky",
              top: "20px"
            }}>
              <h2 style={{ color: "#333", marginBottom: "20px" }}>Order Summary</h2>

              {/* Promo Code */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                  Promo Code:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    style={{
                      flex: 1,
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={applyingPromo}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: applyingPromo ? "#6c757d" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: applyingPromo ? "not-allowed" : "pointer",
                      fontSize: "14px"
                    }}
                  >
                    {applyingPromo ? "Applying..." : "Apply"}
                  </button>
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                  Try: SAVE10, WELCOME20, FIRST50
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: "1px solid #eee", paddingTop: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#666" }}>Subtotal ({cart.totalItems} items):</span>
                  <span style={{ fontWeight: "bold" }}>{formatCurrency(subtotal)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#666" }}>Shipping:</span>
                  <span style={{ fontWeight: "bold", color: shipping === 0 ? "#28a745" : "#333" }}>
                    {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#666" }}>Tax (GST 18%):</span>
                  <span style={{ fontWeight: "bold" }}>{formatCurrency(tax)}</span>
                </div>

                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#28a745" }}>Discount:</span>
                    <span style={{ fontWeight: "bold", color: "#28a745" }}>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div style={{ 
                  borderTop: "2px solid #28a745", 
                  paddingTop: "10px", 
                  marginTop: "10px",
                  display: "flex", 
                  justifyContent: "space-between" 
                }}>
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>Total:</span>
                  <span style={{ fontSize: "20px", fontWeight: "bold", color: "#28a745" }}>
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Shipping Info */}
              {shipping === 0 ? (
                <div style={{ 
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  padding: "10px",
                  borderRadius: "4px",
                  marginTop: "15px",
                  fontSize: "14px",
                  textAlign: "center"
                }}>
                  🎉 You qualify for FREE shipping!
                </div>
              ) : (
                <div style={{ 
                  backgroundColor: "#fff3cd",
                  color: "#856404",
                  padding: "10px",
                  borderRadius: "4px",
                  marginTop: "15px",
                  fontSize: "14px",
                  textAlign: "center"
                }}>
                  Add {formatCurrency(500 - subtotal)} more for FREE shipping
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={proceedToCheckout}
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginTop: "20px"
                }}
              >
                Proceed to Checkout
              </button>

              {/* Security Info */}
              <div style={{ 
                textAlign: "center", 
                marginTop: "15px", 
                fontSize: "12px", 
                color: "#666" 
              }}>
                🔒 Secure checkout with SSL encryption
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Cart */
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🛒</div>
          <h2 style={{ color: "#666", marginBottom: "15px" }}>Your cart is empty</h2>
          <p style={{ color: "#999", marginBottom: "30px" }}>
            Looks like you haven't added any items to your cart yet.
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
    </div>
  );
}