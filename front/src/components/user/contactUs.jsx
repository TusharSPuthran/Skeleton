import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        "http://localhost:7000/admin/contact-us",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSubmitMessage("Thank you for contacting us! We'll get back to you soon.");
        setMessageType("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: ""
        });
      } else {
        setSubmitMessage(response.data.message || "Failed to send message");
        setMessageType("error");
      }
    } catch (error) {
      setSubmitMessage("Error sending message. Please try again.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shopLocation = {
    // Replace with your actual shop coordinates
    lat: 13.175413501650684, // Bangalore coordinates as example
    lng: 74.75978514110177,
    name: "Our Shop Location",
    address: "Yermal Bada"
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#28a745", margin: 0 }}>Contact Us</h1>
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
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {/* Contact Information */}
        <div>
          <h2 style={{ color: "#28a745", marginBottom: "20px" }}>Get in Touch</h2>
          
          <div style={{ marginBottom: "25px" }}>
            <div style={{ marginBottom: "15px" }}>
              <h3 style={{ color: "#333", fontSize: "18px", marginBottom: "5px" }}>📍 Address</h3>
              <p style={{ color: "#666", margin: 0 }}>{shopLocation.address}</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <h3 style={{ color: "#333", fontSize: "18px", marginBottom: "5px" }}>📞 Phone</h3>
              <p style={{ color: "#666", margin: 0 }}>+91 99999 99999</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <h3 style={{ color: "#333", fontSize: "18px", marginBottom: "5px" }}>✉️ Email</h3>
              <p style={{ color: "#666", margin: 0 }}>info@ourshop.com</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <h3 style={{ color: "#333", fontSize: "18px", marginBottom: "5px" }}>🕒 Business Hours</h3>
              <div style={{ color: "#666" }}>
                <p style={{ margin: "2px 0" }}>Monday - Friday: 9:00 AM - 8:00 PM</p>
                <p style={{ margin: "2px 0" }}>Saturday: 9:00 AM - 6:00 PM</p>
                <p style={{ margin: "2px 0" }}>Sunday: 10:00 AM - 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 style={{ color: "#28a745", marginBottom: "20px" }}>Send us a Message</h2>
          
          {submitMessage && (
            <div style={{
              padding: "10px",
              marginBottom: "20px",
              borderRadius: "4px",
              backgroundColor: messageType === "success" ? "#d4edda" : "#f8d7da",
              color: messageType === "success" ? "#155724" : "#721c24",
              border: `1px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`
            }}>
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontWeight: "bold", color: "#333", marginBottom: "5px" }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontWeight: "bold", color: "#333", marginBottom: "5px" }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontWeight: "bold", color: "#333", marginBottom: "5px" }}>
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontWeight: "bold", color: "#333", marginBottom: "5px" }}>
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: "bold", color: "#333", marginBottom: "5px" }}>
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                required
                rows="5"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: isSubmitting ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: isSubmitting ? "not-allowed" : "pointer"
              }}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>

      {/* Map Section */}
      <div style={{ marginTop: "40px" }}>
        <h2 style={{ color: "#28a745", marginBottom: "20px" }}>Find Us Here</h2>
        
        {/* Google Maps Embed */}
        <div style={{
          width: "100%",
          height: "400px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1633.3549658244908!2d74.75952350776112!3d13.175341030703466!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbcb12337b9e535%3A0x2f15480d979302b7!2sYermal%20Bada!5e0!3m2!1sen!2sin!4v1756881304966!5m2!1sen!2sin`}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Shop Location"
          />
        </div>
      </div>
    </div>
  );
}