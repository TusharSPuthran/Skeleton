const orderSchema = require("../Models/order_schema");
const cartSchema = require("../Models/cart_schema");
const productSchema = require("../Models/product_schema");
const nodemailer = require("nodemailer");

// ✅ Place Order
const PlaceOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod,
      orderNotes
    } = req.body;

    const userId = req.user.id;

    // Get user's cart
    const cart = await cartSchema
      .findOne({ userId: userId })
      .populate('items.productId', 'name images price stock');

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    // Validate stock availability
    for (const item of cart.items) {
      if (!item.productId || item.productId.stock < item.quantity) {
        return res.json({
          success: false,
          message: `${item.productId?.name || 'Product'} is out of stock or insufficient quantity available`
        });
      }
    }

    // Calculate order summary
    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const tax = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + shippingCost + tax;

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      productName: item.productId.name,
      productImage: item.productId.images[0] || '',
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2, 8);
    const orderId = `ORD-${timestamp}-${randomString}`.toUpperCase();

    // Create order
    const newOrder = new orderSchema({
      orderId: orderId,
      userId: userId,
      items: orderItems,
      shippingAddress: shippingAddress,
      orderSummary: {
        subtotal: subtotal,
        shippingCost: shippingCost,
        tax: tax,
        totalAmount: totalAmount
      },
      paymentMethod: paymentMethod,
      orderNotes: orderNotes || '',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    const savedOrder = await newOrder.save();

    // Update product stock
    for (const item of cart.items) {
      await productSchema.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear user's cart
    await cartSchema.findOneAndDelete({ userId: userId });

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(savedOrder, req.user);
    } catch (emailError) {
      console.error("Order confirmation email failed:", emailError);
    }

    res.json({
      success: true,
      message: "Order placed successfully",
      order: savedOrder
    });

  } catch (err) {
    console.error("Place order error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get User Orders
const GetUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    let filter = { userId: userId };
    if (status) filter.status = status;

    const orders = await orderSchema
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await orderSchema.countDocuments(filter);

    res.json({
      success: true,
      orders: orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total: total
    });

  } catch (err) {
    console.error("Get user orders error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get Single Order
const GetOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    let filter = {};

    // If admin, can view any order
    if (req.user.role === 'admin') {
      filter = { orderId: orderId };
    } else {
      // If client, can only view own orders
      filter = { orderId: orderId, userId: userId };
    }

    const order = await orderSchema
      .findOne(filter)
      .populate('userId', 'name email phone');

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (err) {
    console.error("Get order error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Get All Orders (Admin only)
const GetAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      startDate,
      endDate,
      search
    } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await orderSchema
      .find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await orderSchema.countDocuments(filter);

    // Calculate summary stats
    const totalRevenue = await orderSchema.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$orderSummary.totalAmount' } } }
    ]);

    const stats = {
      totalOrders: total,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingOrders: await orderSchema.countDocuments({ status: 'pending' }),
      processingOrders: await orderSchema.countDocuments({ status: 'processing' }),
      shippedOrders: await orderSchema.countDocuments({ status: 'shipped' }),
      deliveredOrders: await orderSchema.countDocuments({ status: 'delivered' })
    };

    res.json({
      success: true,
      orders: orders,
      stats: stats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total: total
    });

  } catch (err) {
    console.error("Get all orders error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Update Order Status (Admin only)
const UpdateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, cancellationReason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const updateData = {
      status: status,
      updatedAt: new Date()
    };

    if (status === 'shipped' && trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = 'paid'; // Auto-mark as paid on delivery for COD
    }

    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      if (cancellationReason) updateData.cancellationReason = cancellationReason;
    }

    const updatedOrder = await orderSchema.findOneAndUpdate(
      { orderId: orderId },
      updateData,
      { new: true }
    );

    if (!updatedOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    // If order is cancelled, restore stock
    if (status === 'cancelled' && updatedOrder.status !== 'cancelled') {
      for (const item of updatedOrder.items) {
        await productSchema.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    // Send status update email to customer
    try {
      await sendOrderStatusUpdateEmail(updatedOrder);
    } catch (emailError) {
      console.error("Order status update email failed:", emailError);
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder
    });

  } catch (err) {
    console.error("Update order status error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Cancel Order (User can cancel pending/confirmed orders)
const CancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await orderSchema.findOne({
      orderId: orderId,
      userId: userId
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Only allow cancellation of pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.json({
        success: false,
        message: "Order cannot be cancelled at this stage"
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by customer';

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await productSchema.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: order
    });

  } catch (err) {
    console.error("Cancel order error:", err);
    res.json({ success: false, error: err.message });
  }
};

// ✅ Send Order Confirmation Email
const sendOrderConfirmationEmail = async (order, user) => {
  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.productName}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${item.price.toFixed(2)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${item.total.toFixed(2)}
      </td>
    </tr>
  `).join('');

  await transporter.sendMail({
    from: `"Shop Orders" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Order Confirmation - ${order.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Order Confirmed! 🎉</h2>
        <p>Hi ${user.name || 'Customer'},</p>
        <p>Thank you for your order. Your order has been confirmed and will be processed shortly.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
          <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery.toLocaleDateString()}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="text-align: right; margin: 20px 0;">
          <p><strong>Subtotal:</strong> ₹${order.orderSummary.subtotal.toFixed(2)}</p>
          <p><strong>Shipping:</strong> ₹${order.orderSummary.shippingCost.toFixed(2)}</p>
          <p><strong>Tax:</strong> ₹${order.orderSummary.tax.toFixed(2)}</p>
          <h3 style="color: #28a745;"><strong>Total: ₹${order.orderSummary.totalAmount.toFixed(2)}</strong></h3>
        </div>

        <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4>Shipping Address</h4>
          <p>${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
          Phone: ${order.shippingAddress.phone}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          You can track your order status in your account dashboard. We'll send you updates as your order progresses.
        </p>
      </div>
    `,
    text: `Order Confirmed! Order ID: ${order.orderId}. Total: ₹${order.orderSummary.totalAmount.toFixed(2)}. Estimated delivery: ${order.estimatedDelivery.toLocaleDateString()}`
  });
};

// ✅ Send Order Status Update Email
const sendOrderStatusUpdateEmail = async (order) => {
  // Get user details
  const userOrder = await orderSchema.findById(order._id).populate('userId', 'name email');

  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const statusMessages = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is being processed and will be shipped soon.",
    shipped: "Great news! Your order has been shipped.",
    delivered: "Your order has been delivered successfully.",
    cancelled: "Your order has been cancelled."
  };

  let additionalInfo = '';
  if (order.status === 'shipped' && order.trackingNumber) {
    additionalInfo = `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>`;
  }

  await transporter.sendMail({
    from: `"Shop Orders" <${process.env.EMAIL_USER}>`,
    to: userOrder.userId.email,
    subject: `Order Update - ${order.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Order Status Update</h2>
        <p>Hi ${userOrder.userId.name},</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order ${order.orderId}</h3>
          <p><strong>Status:</strong> <span style="color: #28a745; text-transform: uppercase; font-weight: bold;">${order.status}</span></p>
          <p>${statusMessages[order.status]}</p>
          ${additionalInfo}
        </div>

        ${order.status === 'delivered' ? `
          <div style="text-align: center; margin: 30px 0;">
            <p>We hope you love your purchase! Please rate your experience.</p>
          </div>
        ` : ''}

        <p style="color: #666; font-size: 14px;">
          Thank you for shopping with us!
        </p>
      </div>
    `,
    text: `Order ${order.orderId} status updated to: ${order.status}. ${statusMessages[order.status]}`
  });
};

module.exports = {
  PlaceOrder,
  GetUserOrders,
  GetOrder,
  GetAllOrders,
  UpdateOrderStatus,
  CancelOrder
};