import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/login/login";
import Signup from "./components/login/signup";
import ForgotPassword from "./components/login/frogotPassword";
import OTPVerification from "./components/login/OTPVerification";
import ResetPassword from "./components/login/resetPassword";
import Home from "./components/home";
import AdminHome from "./components/admin/adminHome"; // This IS the admin dashboard
import ClientHome from "./components/user/userHome"; // This IS the user dashboard
import ContactUs from "./components/user/ContactUs";
import UserManagement from "./components/admin/userManagement";
import AdminContactManagement from "./components/admin/contactManagement";
import AdminProductManagement from "./components/admin/productManagement";
import ProductCatalog from "./components/user/productCatalog";
import ProductDetails from "./components/user/productDetails";
import ShoppingCart from "./components/user/shoppingCart";
import Checkout from "./components/user/checkout";
import OrderHistory from "./components/user/orderHistory";
import AdminOrderManagement from "./components/admin/orderManagement";

// ✅ Get user role from localStorage
function getUserRole() {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      return JSON.parse(user).role;
    } catch {
      return null;
    }
  }
  return null;
}

// ✅ Protected route wrapper with role checking
function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem("authToken");
  const userRole = getUserRole();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate home based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin-home" replace />;
    } else {
      return <Navigate to="/client-home" replace />;
    }
  }
  
  return children;
}

// ✅ Public route wrapper (only show if no token)
function PublicRoute({ children }) {
  const token = localStorage.getItem("authToken");
  const userRole = getUserRole();
  
  if (token) {
    // Redirect to appropriate home based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin-home" replace />;
    } else {
      return <Navigate to="/client-home" replace />;
    }
  }
  
  return children;
}

export default function App() {
  const token = localStorage.getItem("authToken");
  const userRole = getUserRole();

  return (
    <Router>
      <Routes>
        {/* Public routes (redirect to appropriate home if logged in) */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><OTPVerification /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* Public product browsing - anyone can view products */}
        <Route path="/products" element={<ProductCatalog />} />
        <Route path="/products/:productId" element={<ProductDetails />} />

        {/* Admin Routes - adminHome IS the admin dashboard */}
        <Route
          path="/admin-home"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHome />
            </ProtectedRoute>
          }
        />

        {/* Admin Management Pages */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/contacts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminContactManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProductManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminOrderManagement />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes for future admin features */}
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
                <h1>📊 Reports & Analytics</h1>
                <p>Advanced reporting features coming soon...</p>
                <button 
                  onClick={() => window.history.back()}
                  style={{ 
                    padding: "10px 20px", 
                    backgroundColor: "#007bff", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer" 
                  }}
                >
                  ← Go Back
                </button>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
                <h1>⚙️ System Settings</h1>
                <p>System configuration options coming soon...</p>
                <button 
                  onClick={() => window.history.back()}
                  style={{ 
                    padding: "10px 20px", 
                    backgroundColor: "#007bff", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer" 
                  }}
                >
                  ← Go Back
                </button>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Client/User Routes - userHome IS the user dashboard */}
        <Route
          path="/client-home"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientHome />
            </ProtectedRoute>
          }
        />

        {/* Shopping & E-commerce Routes (Client only) */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ShoppingCart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <OrderHistory />
            </ProtectedRoute>
          }
        />

        {/* Contact Us - Client only */}
        <Route
          path="/contact-us"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ContactUs />
            </ProtectedRoute>
          }
        />

        {/* Legacy home route - redirect to appropriate home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* ✅ Root route: redirect based on token and role */}
        <Route
          path="/"
          element={
            token
              ? userRole === 'admin'
                ? <Navigate to="/admin-home" replace />
                : <Navigate to="/client-home" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* 404 Route - Catch all unmatched routes */}
        <Route
          path="*"
          element={
            <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial, sans-serif" }}>
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <button 
                onClick={() => {
                  if (token) {
                    window.location.href = userRole === 'admin' ? '/admin-home' : '/client-home';
                  } else {
                    window.location.href = '/login';
                  }
                }}
                style={{ 
                  padding: "10px 20px", 
                  backgroundColor: "#007bff", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px", 
                  cursor: "pointer" 
                }}
              >
                Go Home
              </button>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}