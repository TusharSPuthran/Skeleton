const productSchema = require("../Models/product_schema");
const cartSchema = require("../Models/cart_schema");
const orderSchema = require("../Models/order_schema");
const stockNotificationSchema = require("../Models/notification_schema");
const nodemailer = require("nodemailer");

// ✅ Add Product (Admin only)
const AddProduct = async (req, res) => {
  try {
    const {
      name, description, price, category, brand, images, stock, sku, 
      specifications, tags, discount
    } = req.body;
    
    const adminId = req.user.id;

    // Validation
    if (!name || !description || !price || !category || !sku) {
      return res.json({ 
        success: false, 
        message: "Name, description, price, category, and SKU are required" 
      });
    }

    // Check if SKU already exists
    const existingSKU = await productSchema.findOne({ sku: sku });
    if (existingSKU) {
      return res.json({ 
        success: false, 
        message: "SKU already exists" 
      });
    }

    const newProduct = new productSchema({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.trim(),
      brand: brand ? brand.trim() : "",
      images: images || [],
      stock: parseInt(stock) || 0,
      sku: sku.trim().toUpperCase(),
      specifications: specifications || [],
      tags: tags || [],
      discount: discount || { percentage: 0 },
      createdBy: adminId
    });

    const savedProduct = await newProduct.save();

    res.json({
      success: true,
      message: "Product added successfully",
      product: savedProduct
    });

  } catch (err) {
    console.error("Add product error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get All Products (Public - with filters)
const GetAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      inStock
    } = req.query;

    // Build filter
    let filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (inStock === 'true') filter.stock = { $gt: 0 };

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await productSchema
      .find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await productSchema.countDocuments(filter);

    res.json({
      success: true,
      products: products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total: total
    });

  } catch (err) {
    console.error("Get products error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get Single Product
const GetProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productSchema
      .findById(productId)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      product: product
    });

  } catch (err) {
    console.error("Get product error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Update Product (Admin only)
const UpdateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    const adminId = req.user.id;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.createdBy;
    delete updateData.ratings;

    const oldProduct = await productSchema.findById(productId);
    if (!oldProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    const updatedProduct = await productSchema.findByIdAndUpdate(
      productId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // If stock increased from 0, notify users
    if (oldProduct.stock === 0 && updateData.stock > 0) {
      await notifyStockAvailable(productId);
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (err) {
    console.error("Update product error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Delete Product (Admin only)
const DeleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedProduct = await productSchema.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Remove from all carts
    await cartSchema.updateMany(
      { "items.productId": productId },
      { $pull: { items: { productId: productId } } }
    );

    // Deactivate stock notifications
    await stockNotificationSchema.updateMany(
      { productId: productId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (err) {
    console.error("Delete product error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Add to Cart
const AddToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Check if product exists and is active
    const product = await productSchema.findById(productId);
    if (!product || product.status !== 'active') {
      return res.json({ success: false, message: "Product not available" });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.json({ 
        success: false, 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    // Find or create cart
    let cart = await cartSchema.findOne({ userId: userId });
    if (!cart) {
      cart = new cartSchema({ userId: userId, items: [] });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      if (newQuantity > product.stock) {
        return res.json({ 
          success: false, 
          message: `Only ${product.stock} items available in stock` 
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId: productId,
        quantity: parseInt(quantity),
        price: product.price
      });
    }

    await cart.save();

    // Populate cart items with product details
    const populatedCart = await cartSchema
      .findById(cart._id)
      .populate('items.productId', 'name images price stock');

    res.json({
      success: true,
      message: "Product added to cart",
      cart: populatedCart
    });

  } catch (err) {
    console.error("Add to cart error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get Cart
const GetCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await cartSchema
      .findOne({ userId: userId })
      .populate('items.productId', 'name images price stock status');

    if (!cart) {
      return res.json({
        success: true,
        cart: { items: [], totalAmount: 0, totalItems: 0 }
      });
    }

    // Filter out inactive products
    cart.items = cart.items.filter(item => 
      item.productId && item.productId.status === 'active'
    );

    await cart.save(); // Save filtered cart

    res.json({
      success: true,
      cart: cart
    });

  } catch (err) {
    console.error("Get cart error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Update Cart Item
const UpdateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const cart = await cartSchema.findOne({ userId: userId });
    if (!cart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.json({ success: false, message: "Item not found in cart" });
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock
      const product = await productSchema.findById(productId);
      if (quantity > product.stock) {
        return res.json({ 
          success: false, 
          message: `Only ${product.stock} items available in stock` 
        });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    const populatedCart = await cartSchema
      .findById(cart._id)
      .populate('items.productId', 'name images price stock');

    res.json({
      success: true,
      message: "Cart updated successfully",
      cart: populatedCart
    });

  } catch (err) {
    console.error("Update cart error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Remove from Cart
const RemoveFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await cartSchema.findOne({ userId: userId });
    if (!cart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();

    const populatedCart = await cartSchema
      .findById(cart._id)
      .populate('items.productId', 'name images price stock');

    res.json({
      success: true,
      message: "Item removed from cart",
      cart: populatedCart
    });

  } catch (err) {
    console.error("Remove from cart error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Request Stock Notification
const RequestStockNotification = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if product exists
    const product = await productSchema.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Check if already requested
    const existingRequest = await stockNotificationSchema.findOne({
      userId: userId,
      productId: productId,
      isActive: true
    });

    if (existingRequest) {
      return res.json({ 
        success: false, 
        message: "You will already be notified when this product is back in stock" 
      });
    }

    // Create notification request
    const notification = new stockNotificationSchema({
      userId: userId,
      productId: productId,
      email: userEmail
    });

    await notification.save();

    res.json({
      success: true,
      message: "You will be notified when this product is back in stock"
    });

  } catch (err) {
    console.error("Stock notification error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get Stock Notification Requests (Admin only)
const GetStockNotifications = async (req, res) => {
  try {
    const { productId } = req.query;

    let filter = { isActive: true };
    if (productId) filter.productId = productId;

    const notifications = await stockNotificationSchema
      .find(filter)
      .populate('userId', 'name email')
      .populate('productId', 'name images stock')
      .sort({ createdAt: -1 });

    // Group by product
    const groupedNotifications = {};
    notifications.forEach(notification => {
      const pId = notification.productId._id.toString();
      if (!groupedNotifications[pId]) {
        groupedNotifications[pId] = {
          product: notification.productId,
          requests: []
        };
      }
      groupedNotifications[pId].requests.push({
        user: notification.userId,
        email: notification.email,
        requestedAt: notification.createdAt
      });
    });

    res.json({
      success: true,
      notifications: Object.values(groupedNotifications)
    });

  } catch (err) {
    console.error("Get stock notifications error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Notify Stock Available (Internal function)
const notifyStockAvailable = async (productId) => {
  try {
    const product = await productSchema.findById(productId);
    const notifications = await stockNotificationSchema
      .find({ productId: productId, isActive: true, notified: false })
      .populate('userId', 'name email');

    if (notifications.length === 0) return;

    // Setup email transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send emails to all users
    for (const notification of notifications) {
      try {
        await transporter.sendMail({
          from: `"Shop Notification" <${process.env.EMAIL_USER}>`,
          to: notification.email,
          subject: `${product.name} is Back in Stock!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #28a745;">Good News!</h2>
              <p>The product you were waiting for is now back in stock:</p>
              
              <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>${product.name}</h3>
                <p><strong>Price:</strong> ₹${product.price}</p>
                <p><strong>Available Stock:</strong> ${product.stock} units</p>
                <p style="color: #666;">${product.description.substring(0, 150)}...</p>
              </div>
              
              <p>Hurry up and place your order before it goes out of stock again!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${product._id}" 
                   style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Buy Now
                </a>
              </div>
              
              <p style="color: #666; font-size: 12px;">
                You received this email because you requested to be notified when this product came back in stock.
              </p>
            </div>
          `,
          text: `${product.name} is back in stock! Price: ₹${product.price}. Available: ${product.stock} units. Order now!`
        });

        // Mark as notified
        notification.notified = true;
        notification.notifiedAt = new Date();
        await notification.save();

      } catch (emailError) {
        console.error("Failed to send stock notification email:", emailError);
      }
    }

    console.log(`Stock notification emails sent for product: ${product.name}`);

  } catch (error) {
    console.error("Notify stock available error:", error);
  }
};

module.exports = {
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
};