const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/locations", require("./routes/locations"));
app.use("/api/bookings", require("./routes/bookings")); 
app.use("/api/admin", require("./routes/admin"));


// Default page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "intro.html"));
});

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Server start
app.listen(5000, () => console.log("Server running on port 5000"));
