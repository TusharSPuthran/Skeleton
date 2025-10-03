const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    trim: true
  },
  brand: { 
    type: String, 
    trim: true,
    default: ""
  },
  images: [{ 
    type: String // URLs to product images
  }],
  stock: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  sku: { 
    type: String, 
    unique: true,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  specifications: [{
    key: String,
    value: String
  }],
  tags: [String],
  discount: {
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    startDate: Date,
    endDate: Date
  },
  ratings: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin',
    required: true
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });

module.exports = mongoose.model("product", productSchema);