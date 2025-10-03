const express = require("express");
const router = express.Router();
const { 
  authMiddleware, 
  adminOnly, 
  clientOnly, 
  authenticatedOnly 
} = require("../middleware/authMiddleware");

const { 
  Register, 
  Login, 
  ForgotPassword, 
  VerifyOTP, 
  ResetPassword,
  ContactUs,
  GetContactMessages,
  UpdateContactStatus,
  GetUserContacts,
  GetDashboardStats,
  GetAllUsers,
  UpdateUserRole,
  DeleteUser,
  UpdateProfile,
  GetUserProfile,
  GetUserStats,
  ChangePassword
} = require("../Controllers/Admin");

const {
  AddProduct,
  GetAllProducts,
  GetProduct,
  UpdateProduct,
  DeleteProduct,
  AddToCart,
  GetCart,
  UpdateCartItem,
  RemoveFromCart,
  RequestStockNotification,
  GetStockNotifications
} = require("../Controllers/Product");

const {
  PlaceOrder,
  GetUserOrders,
  GetOrder,
  GetAllOrders,
  UpdateOrderStatus,
  CancelOrder
} = require("../Controllers/Order");

// Public routes
router.post("/Register", Register);
router.post("/login", Login);
router.post("/forgot-password", ForgotPassword);
router.post("/verify-otp", VerifyOTP);
router.post("/reset-password", ResetPassword);

// ✅ Protected route - session check for any authenticated user
router.get("/check-session", authMiddleware, authenticatedOnly, (req, res) => {
  res.json({
    success: true,
    message: "Session is valid",
    user: req.user
  });
});

// ✅ Profile Routes (Any authenticated user)
router.get("/profile", authMiddleware, authenticatedOnly, GetUserProfile);
router.put("/profile", authMiddleware, authenticatedOnly, UpdateProfile);
router.post("/change-password", authMiddleware, authenticatedOnly, ChangePassword);

// ✅ User Dashboard Statistics (Client only)
router.get("/user-stats", authMiddleware, clientOnly, GetUserStats);

// ✅ Dashboard Statistics (Admin only)
router.get("/dashboard-stats", authMiddleware, adminOnly, GetDashboardStats);

// ✅ User Management Routes (Admin only)
router.get("/users", authMiddleware, adminOnly, GetAllUsers);
router.put("/users/:userId/role", authMiddleware, adminOnly, UpdateUserRole);
router.delete("/users/:userId", authMiddleware, adminOnly, DeleteUser);

// ✅ Product Routes

// Public product routes (anyone can view products)
router.get("/products", GetAllProducts);
router.get("/products/:productId", GetProduct);

// Admin product management routes
router.post("/products", authMiddleware, adminOnly, AddProduct);
router.put("/products/:productId", authMiddleware, adminOnly, UpdateProduct);
router.delete("/products/:productId", authMiddleware, adminOnly, DeleteProduct);

// Stock notification routes
router.get("/stock-notifications", authMiddleware, adminOnly, GetStockNotifications);
router.post("/stock-notifications", authMiddleware, clientOnly, RequestStockNotification);

// ✅ Shopping Cart Routes (Client only)
router.get("/cart", authMiddleware, clientOnly, GetCart);
router.post("/cart", authMiddleware, clientOnly, AddToCart);
router.put("/cart", authMiddleware, clientOnly, UpdateCartItem);
router.delete("/cart/:productId", authMiddleware, clientOnly, RemoveFromCart);

// ✅ Order Routes

// Client order routes
router.post("/orders", authMiddleware, clientOnly, PlaceOrder);
router.get("/orders", authMiddleware, clientOnly, GetUserOrders);
router.get("/orders/:orderId", authMiddleware, authenticatedOnly, GetOrder); // Both admin and client
router.delete("/orders/:orderId", authMiddleware, clientOnly, CancelOrder);

// Admin order management routes
router.get("/admin/orders", authMiddleware, adminOnly, GetAllOrders);
router.put("/admin/orders/:orderId", authMiddleware, adminOnly, UpdateOrderStatus);

// ✅ Contact Us Routes

// Client can submit contact form
router.post("/contact-us", authMiddleware, clientOnly, ContactUs);

// Client can view their own contact history
router.get("/my-contacts", authMiddleware, clientOnly, GetUserContacts);

// Admin can view all contact messages
router.get("/contact-messages", authMiddleware, adminOnly, GetContactMessages);

// Admin can update contact status
router.put("/contact-messages/:contactId", authMiddleware, adminOnly, UpdateContactStatus);

// ✅ Admin-only routes
router.get("/admin-dashboard", authMiddleware, adminOnly, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Admin Dashboard",
    user: req.user
  });
});

// ✅ Client-only routes
router.get("/client-dashboard", authMiddleware, clientOnly, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Client Dashboard",
    user: req.user
  });
});

// ✅ Route to get user role info
router.get("/user-info", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "User information retrieved",
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    navigationRoute: req.user.role === 'admin' ? 'adminHome' : 'clientHome'
  });
});

module.exports = router;