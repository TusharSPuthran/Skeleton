import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Checkout() {
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderNotes, setOrderNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
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
        const cartData = response.data.cart;
        if (!cartData.items || cartData.items.length === 0) {
          setMessage('Your cart is empty. Please add items to proceed with checkout.');
          setMessageType('error');
          setTimeout(() => navigate("/products"), 3000);
          return;
        }
        setCart(cartData);
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

  const validateShippingAddress = () => {
    const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    const missing = required.filter(field => !shippingAddress[field].trim());
    
    if (missing.length > 0) {
      setMessage(`Please fill in required fields: ${missing.join(', ')}`);
      setMessageType('error');
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(shippingAddress.phone)) {
      setMessage('Please enter a valid 10-digit mobile number');
      setMessageType('error');
      return false;
    }

    if (!/^\d{6}$/.test(shippingAddress.pincode)) {
      setMessage('Please enter a valid 6-digit pincode');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const placeOrder = async () => {
    console.log("Starting order placement...");
    
    if (!validateShippingAddress()) {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return;
    }

    if (!agreedToTerms) {
      setMessage('Please agree to the terms and conditions');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return;
    }

    // Check if cart has items
    if (!cart.items || cart.items.length === 0) {
      setMessage('Your cart is empty. Please add items before placing an order.');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return;
    }

    setPlacing(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage('Please log in to place an order');
        setMessageType('error');
        navigate('/login');
        return;
      }

      const orderData = {
        shippingAddress,
        paymentMethod,
        orderNotes: orderNotes.trim()
      };

      console.log("Sending order data:", orderData);

      const response = await axios.post(
        "http://localhost:7000/admin/orders",
        orderData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Order response:", response.data);

      if (response.data.success) {
        setMessage('Order placed successfully! Redirecting to your orders...');
        setMessageType('success');
        
        // Clear cart and redirect after 2 seconds
        setTimeout(() => {
          navigate("/orders");
        }, 2000);
      } else {
        setMessage(response.data.message || 'Failed to place order');
        setMessageType('error');
        console.error("Order placement failed:", response.data);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      
      if (error.response) {
        // Server responded with error
        console.error("Error response:", error.response.data);
        setMessage(error.response.data.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Network error
        console.error("Network error:", error.request);
        setMessage('Network error. Please check your connection and try again.');
      } else {
        // Other error
        console.error("Error message:", error.message);
        setMessage('Error placing order. Please try again.');
      }
      setMessageType('error');
    } finally {
      setPlacing(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const calculateShipping = (subtotal) => {
    return subtotal > 500 ? 0 : 50;
  };

  const calculateTax = (subtotal) => {
    return subtotal * 0.18;
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
        <p>Loading checkout...</p>
      </div>
    );
  }

  const subtotal = cart.totalAmount || 0;
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;

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
          <h1 style={{ color: "#28a745", margin: "0 0 5px 0" }}>Checkout</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Complete your order
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/cart")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Back to Cart
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

      {/* Progress Steps */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {[
            { step: 1, label: "Shipping Address" },
            { step: 2, label: "Payment Method" },
            { step: 3, label: "Review & Place Order" }
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: activeStep >= item.step ? "#28a745" : "#e9ecef",
                color: activeStep >= item.step ? "white" : "#6c757d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                marginRight: "10px"
              }}>
                {item.step}
              </div>
              <span style={{ 
                color: activeStep >= item.step ? "#28a745" : "#6c757d",
                fontWeight: activeStep === item.step ? "bold" : "normal"
              }}>
                {item.label}
              </span>
              {item.step < 3 && (
                <div style={{
                  flex: 1,
                  height: "2px",
                  backgroundColor: activeStep > item.step ? "#28a745" : "#e9ecef",
                  marginLeft: "15px"
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        {/* Main Content */}
        <div>
          {/* Step 1: Shipping Address */}
          {activeStep === 1 && (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "25px"
            }}>
              <h2 style={{ color: "#333", marginBottom: "20px" }}>Shipping Address</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.fullName}
                    onChange={(e) => handleAddressChange('fullName', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={shippingAddress.addressLine1}
                  onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                  placeholder="House number, building name"
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
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={shippingAddress.addressLine2}
                  onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                  placeholder="Street, area, locality (optional)"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    State *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.pincode}
                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                    placeholder="6-digit pincode"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Landmark
                </label>
                <input
                  type="text"
                  value={shippingAddress.landmark}
                  onChange={(e) => handleAddressChange('landmark', e.target.value)}
                  placeholder="Nearby landmark (optional)"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>

              <button
                onClick={() => setActiveStep(2)}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {activeStep === 2 && (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "25px"
            }}>
              <h2 style={{ color: "#333", marginBottom: "20px" }}>Payment Method</h2>
              
              <div style={{ marginBottom: "20px" }}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "flex", alignItems: "center", padding: "15px", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", backgroundColor: paymentMethod === 'cod' ? "#e3f2fd" : "white" }}>
                    <input
                      type="radio"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ marginRight: "10px" }}
                    />
                    <div>
                      <strong>Cash on Delivery (COD)</strong>
                      <div style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                        Pay when your order is delivered to your doorstep
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "flex", alignItems: "center", padding: "15px", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", backgroundColor: paymentMethod === 'online' ? "#e3f2fd" : "white" }}>
                    <input
                      type="radio"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ marginRight: "10px" }}
                    />
                    <div>
                      <strong>Online Payment</strong>
                      <div style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                        Pay securely using UPI, Cards, or Net Banking
                      </div>
                      <div style={{ fontSize: "12px", color: "#dc3545", marginTop: "5px" }}>
                        Currently unavailable - Coming soon!
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setActiveStep(1)}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                >
                  Back to Address
                </button>
                
                <button
                  onClick={() => setActiveStep(3)}
                  disabled={paymentMethod === 'online'}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: paymentMethod === 'online' ? "#6c757d" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: paymentMethod === 'online' ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review Order */}
          {activeStep === 3 && (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "25px"
            }}>
              <h2 style={{ color: "#333", marginBottom: "20px" }}>Review Your Order</h2>
              
              {/* Address Review */}
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                <h4 style={{ color: "#333", marginBottom: "10px" }}>Shipping Address</h4>
                <div style={{ color: "#666", lineHeight: "1.5" }}>
                  {shippingAddress.fullName}<br />
                  {shippingAddress.addressLine1}<br />
                  {shippingAddress.addressLine2 && <>{shippingAddress.addressLine2}<br /></>}
                  {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}<br />
                  Phone: {shippingAddress.phone}
                  {shippingAddress.landmark && <><br />Landmark: {shippingAddress.landmark}</>}
                </div>
                <button
                  onClick={() => setActiveStep(1)}
                  style={{
                    marginTop: "10px",
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    color: "#007bff",
                    border: "1px solid #007bff",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Edit Address
                </button>
              </div>

              {/* Payment Method Review */}
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                <h4 style={{ color: "#333", marginBottom: "10px" }}>Payment Method</h4>
                <div style={{ color: "#666" }}>
                  {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment'}
                </div>
                <button
                  onClick={() => setActiveStep(2)}
                  style={{
                    marginTop: "10px",
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    color: "#007bff",
                    border: "1px solid #007bff",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Change Payment
                </button>
              </div>

              {/* Order Notes */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                  Order Notes (Optional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions for delivery..."
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

              {/* Terms and Conditions */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: "2px" }}
                  />
                  <span style={{ fontSize: "14px", color: "#666" }}>
                    I agree to the <span style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }}>Terms and Conditions</span> and <span style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>
                  </span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setActiveStep(2)}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                >
                  Back to Payment
                </button>
                
                <button
                  onClick={placeOrder}
                  disabled={placing || !agreedToTerms}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: (placing || !agreedToTerms) ? "#6c757d" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (placing || !agreedToTerms) ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}
                >
                  {placing ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div style={{
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            position: "sticky",
            top: "20px"
          }}>
            <h3 style={{ color: "#333", marginBottom: "15px" }}>Order Summary</h3>

            {/* Cart Items */}
            <div style={{ marginBottom: "15px" }}>
              {cart.items && cart.items.map((item) => (
                <div key={item.productId._id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #eee"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#333" }}>
                      {item.productId.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div style={{ borderTop: "1px solid #eee", paddingTop: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#666" }}>Subtotal:</span>
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

            {/* Security Info */}
            <div style={{ 
              textAlign: "center", 
              marginTop: "15px", 
              fontSize: "12px", 
              color: "#666",
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px"
            }}>
              Secure checkout with SSL encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}