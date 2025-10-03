const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockNotificationSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  notified: {
    type: Boolean,
    default: false
  },
  notifiedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate notifications
stockNotificationSchema.index({ userId: 1, productId: 1 }, { unique: true });
stockNotificationSchema.index({ productId: 1, isActive: 1 });

module.exports = mongoose.model("stockNotification", stockNotificationSchema);