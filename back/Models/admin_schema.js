const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  phone: { type: String, default: "" }, // Added phone field
  role: { 
    type: String, 
    enum: ['admin', 'client'], 
    default: 'client' 
  },
  otp: {
    code: { type: String },        // generated OTP
    expiresAt: { type: Date },     // expiry time
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date }     // when OTP was verified
  }
}, {
  timestamps: true // This will add createdAt and updatedAt fields automatically
});

module.exports = mongoose.model("admin", adminSchema);