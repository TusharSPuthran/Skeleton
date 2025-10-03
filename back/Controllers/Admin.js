const adminSchema = require("../Models/admin_schema");
const contactSchema = require("../Models/contact_schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const SECRETE_KEY = process.env.JWT_SECRET || "PRODUCTS"; // fallback if not in .env

// ✅ Register
const Register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let checkEmail = await adminSchema.findOne({ email: email });
    if (checkEmail) {
      return res.json({ success: false, message: "Email already exists!" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Role is automatically set to 'client' by default in schema
    let newAdmin = new adminSchema({ name, email, password: hashedPassword });
    let savedAdmin = await newAdmin.save();
    
    res.json({
      success: true,
      message: "New user registered successfully",
      user: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role
      },
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// ✅ Login with role-based navigation
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await adminSchema.findOne({ email: email });
    if (!user) {
      return res.json({ success: false, message: "Email or Password Invalid!" });
    }
    let checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.json({ success: false, message: "Email or Password Invalid!" });
    }

    // Issue JWT valid for 7 days, including role in token
    let token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRETE_KEY,
      { expiresIn: "7d" }   // 🔥 auto-expiry after 7 days
    );

    // Determine navigation route based on role
    let navigationRoute;
    if (user.role === 'admin') {
      navigationRoute = 'adminHome';
    } else {
      navigationRoute = 'clientHome';
    }

    res.json({
      success: true,
      message: "Login successful!",
      loggedInUser: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
      authToken: token,
      navigationRoute: navigationRoute
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// ✅ Forgot Password - Send OTP
const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.json({ success: false, message: "Email is required" });
    }

    const user = await adminSchema.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.json({ success: false, message: "Email not registered" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP in DB
    user.otp = { code: otp, expiresAt: expiry, verified: false };
    await user.save();

    console.log(`Generated OTP for ${email}: ${otp}`); // ⚠️ remove in production

    // Setup nodemailer
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"Ecom Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Ecom Admin",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your OTP is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #007bff;">${otp}</div>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
      text: `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ success: true, message: "OTP sent to registered email successfully" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.json({ success: false, error: err.message });
  }
};


// ✅ Verify OTP
const VerifyOTP = async (req, res) => {
  try {
    console.log("OTP verification request received");
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.json({ success: false, message: "Email and OTP are required" });
    }

    const user = await adminSchema.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.otp || !user.otp.code) {
      return res.json({ success: false, message: "No OTP found for this user" });
    }

    if (user.otp.verified) {
      return res.json({ success: false, message: "OTP already used" });
    }

    if (new Date() > user.otp.expiresAt) {
      // Clean up expired OTP
      user.otp = undefined;
      await user.save();
      return res.json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (user.otp.code !== otp.trim()) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // Mark OTP as verified but don't delete it yet (needed for password reset)
    user.otp.verified = true;
    user.otp.verifiedAt = new Date();
    await user.save();

    // Optional: Generate a temporary verification token for extra security
    const verificationToken = jwt.sign(
      { 
        email: user.email, 
        otpVerified: true, 
        timestamp: Date.now() 
      }, 
      SECRETE_KEY, 
      { expiresIn: '10m' } // Token valid for 10 minutes
    );

    console.log("OTP verified successfully for:", email);
    res.json({ 
      success: true, 
      message: "OTP verified successfully",
      verificationToken: verificationToken
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Reset Password - Only for verified OTPs
const ResetPassword = async (req, res) => {
  try {
    console.log("Reset password request received");
    const { email, otp, newPassword, verificationToken } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.json({ success: false, message: "All fields are required" });
    }

    // Optional: Verify the verification token for extra security
    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, SECRETE_KEY);
        if (decoded.email !== email.trim().toLowerCase()) {
          return res.json({ success: false, message: "Invalid verification token" });
        }
      } catch (tokenErr) {
        return res.json({ success: false, message: "Verification token expired or invalid" });
      }
    }

    const user = await adminSchema.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.otp || !user.otp.code) {
      return res.json({ success: false, message: "No OTP found for this user" });
    }

    // Check if OTP was verified
    if (!user.otp.verified) {
      return res.json({ success: false, message: "OTP not verified. Please verify OTP first." });
    }

    // Check if verification is still valid (within 10 minutes of verification)
    if (user.otp.verifiedAt && new Date() > new Date(user.otp.verifiedAt.getTime() + 10 * 60 * 1000)) {
      user.otp = undefined;
      await user.save();
      return res.json({ success: false, message: "OTP verification expired. Please start over." });
    }

    if (user.otp.code !== otp.trim()) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (newPassword.length < 6) {
      return res.json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and remove OTP completely from database
    user.password = hashedPassword;
    user.otp = undefined; // Remove OTP after successful password reset
    await user.save();

    console.log("Password reset successful for:", email);
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Contact Us - Save contact form submission
const ContactUs = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validation
    if (!name || !email || !subject || !message) {
      return res.json({ 
        success: false, 
        message: "Name, email, subject, and message are required" 
      });
    }

    // Create new contact entry
    const newContact = new contactSchema({
      userId: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      subject: subject.trim(),
      message: message.trim(),
      status: "pending",
      createdAt: new Date()
    });

    const savedContact = await newContact.save();

    // Optional: Send notification email to admin
    try {
      const nodemailer = require("nodemailer");
      let transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Contact Form" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Admin email
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Contact Form Submission</h2>
            <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <hr>
              <p style="color: #666; font-size: 12px;">
                Submitted on: ${new Date().toLocaleString()}<br>
                Contact ID: ${savedContact._id}
              </p>
            </div>
          </div>
        `,
        text: `New contact form submission from ${name} (${email})\n\nSubject: ${subject}\n\nMessage: ${message}`,
      });
    } catch (emailError) {
      console.log("Email notification failed:", emailError.message);
      // Don't fail the contact submission if email fails
    }

    res.json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
      contactId: savedContact._id
    });

  } catch (err) {
    console.error("Contact form error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get Contact Messages (Admin only)
const GetContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Build filter
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const contacts = await contactSchema
      .find(filter)
      .populate('userId', 'name email') // Populate user details
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await contactSchema.countDocuments(filter);

    res.json({
      success: true,
      contacts: contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total
    });

  } catch (err) {
    console.error("Get contact messages error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Update Contact Message Status (Admin only)
const UpdateContactStatus = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status, adminResponse } = req.body;

    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.json({ 
        success: false, 
        message: "Invalid status. Use: pending, in-progress, or resolved" 
      });
    }

    const updatedContact = await contactSchema.findByIdAndUpdate(
      contactId,
      { 
        status: status,
        adminResponse: adminResponse || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedContact) {
      return res.json({ success: false, message: "Contact message not found" });
    }

    res.json({
      success: true,
      message: "Contact status updated successfully",
      contact: updatedContact
    });

  } catch (err) {
    console.error("Update contact status error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get User's Contact History (Client)
const GetUserContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const contacts = await contactSchema
      .find({ userId: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      contacts: contacts
    });

  } catch (err) {
    console.error("Get user contacts error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get Dashboard Statistics (Admin only)
const GetDashboardStats = async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await adminSchema.countDocuments();
    const totalClients = await adminSchema.countDocuments({ role: 'client' });
    const totalAdmins = await adminSchema.countDocuments({ role: 'admin' });

    // Get contact statistics
    const totalContacts = await contactSchema.countDocuments();
    const pendingContacts = await contactSchema.countDocuments({ status: 'pending' });

    // Get recent contacts (last 10)
    const recentContacts = await contactSchema
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email subject status createdAt');

    // Get recent users (last 10)
    const recentUsers = await adminSchema
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt');

    // Compile statistics
    const stats = {
      totalUsers,
      totalClients,
      totalAdmins,
      totalContacts,
      pendingContacts,
      recentContacts,
      recentUsers
    };

    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      stats: stats
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get User Management Data (Admin only)
const GetAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    // Build filter
    let filter = {};
    if (role) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await adminSchema
      .find(filter)
      .select('name email role createdAt') // Don't include password
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await adminSchema.countDocuments(filter);

    res.json({
      success: true,
      users: users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total
    });

  } catch (err) {
    console.error("Get all users error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Update User Role (Admin only)
const UpdateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    // Validate role
    if (!['admin', 'client'].includes(role)) {
      return res.json({ 
        success: false, 
        message: "Invalid role. Use 'admin' or 'client'" 
      });
    }

    // Prevent admin from changing their own role
    if (userId === adminId) {
      return res.json({ 
        success: false, 
        message: "Cannot change your own role" 
      });
    }

    const updatedUser = await adminSchema.findByIdAndUpdate(
      userId,
      { role: role },
      { new: true }
    ).select('name email role');

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: updatedUser
    });

  } catch (err) {
    console.error("Update user role error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Delete User (Admin only)
const DeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return res.json({ 
        success: false, 
        message: "Cannot delete your own account" 
      });
    }

    const deletedUser = await adminSchema.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    // Also delete user's contact messages
    await contactSchema.deleteMany({ userId: userId });

    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (err) {
    console.error("Delete user error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Update User Profile
const UpdateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validation
    if (!name || !email) {
      return res.json({ 
        success: false, 
        message: "Name and email are required" 
      });
    }

    // Check if email is already taken by another user
    const existingUser = await adminSchema.findOne({ 
      email: email.trim().toLowerCase(), 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.json({ 
        success: false, 
        message: "Email is already taken by another user" 
      });
    }

    // Update user profile
    const updatedUser = await adminSchema.findByIdAndUpdate(
      userId,
      { 
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : undefined,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('name email phone role createdAt');

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Update profile error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get User Profile Details
const GetUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await adminSchema.findById(userId).select('name email phone role createdAt');
    
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (err) {
    console.error("Get user profile error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get User Dashboard Statistics
const GetUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's contact statistics
    const totalContacts = await contactSchema.countDocuments({ userId: userId });
    const pendingContacts = await contactSchema.countDocuments({ userId: userId, status: 'pending' });
    const inProgressContacts = await contactSchema.countDocuments({ userId: userId, status: 'in-progress' });
    const resolvedContacts = await contactSchema.countDocuments({ userId: userId, status: 'resolved' });

    // Get recent contacts
    const recentContacts = await contactSchema
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subject status createdAt');

    const stats = {
      totalContacts,
      pendingContacts,
      inProgressContacts,
      resolvedContacts,
      recentContacts
    };

    res.json({
      success: true,
      stats: stats
    });

  } catch (err) {
    console.error("Get user stats error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Change Password (separate endpoint)
const ChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.json({ 
        success: false, 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.json({ 
        success: false, 
        message: "New password must be at least 6 characters long" 
      });
    }

    // Get user and verify current password
    const user = await adminSchema.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await adminSchema.findByIdAndUpdate(userId, { 
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error("Change password error:", err);
    res.json({ success: false, error: err.message });
  }
};

// Export all functions
module.exports = { 
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
};