const r = require("express").Router();
const Location = require("../models/Location");
const Booking = require("../models/Booking");
const User = require("../models/User");
const auth = require("../middleware/auth");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =======================
   BOOKING NUMBER GENERATOR
======================= */
function generateBookingNumber() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PE-${Date.now()}-${rand}`;
}

/* =======================
   MULTER CONFIG
======================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

/* =======================
   ADD LOCATION (ADMIN)
======================= */
r.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, area, address, totalSlots, hourlyRate } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !area || !address || !totalSlots || !hourlyRate || !image) {
      return res.status(400).json({ message: "All fields required" });
    }

    const location = await Location.create({
      name,
      area,
      address,
      image,
      totalSlots: Number(totalSlots),
      availableSlots: Number(totalSlots),
      hourlyRate: Number(hourlyRate),
      owner: req.user.id
    });

    res.json(location);
  } catch (err) {
    console.error("Add location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET ALL LOCATIONS
======================= */
r.get("/", auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.area) {
      filter.area = { $regex: req.query.area, $options: "i" };
    }

    const locations = await Location.find(filter);
    res.json(locations);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET MY LOCATIONS (ADMIN)
======================= */
r.get("/my", auth, async (req, res) => {
  try {
    const locations = await Location.find({ owner: req.user.id });
    res.json(locations);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   UPDATE LOCATION
======================= */
r.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, area, address, totalSlots, hourlyRate } = req.body;

    const loc = await Location.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!loc) return res.sendStatus(404);

    const diff = Number(totalSlots) - loc.totalSlots;
    loc.availableSlots = Math.max(0, loc.availableSlots + diff);

    loc.name = name;
    loc.area = area;
    loc.address = address;
    loc.totalSlots = Number(totalSlots);
    loc.hourlyRate = Number(hourlyRate);

    if (req.file) {
      const oldPath = path.join(__dirname, "..", "public", loc.image || "");
      if (loc.image && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      loc.image = `/uploads/${req.file.filename}`;
    }

    await loc.save();
    res.json({ message: "Location updated" });
  } catch (err) {
    console.error("Update location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   DELETE LOCATION
======================= */
r.delete("/:id", auth, async (req, res) => {
  try {
    const loc = await Location.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!loc) return res.sendStatus(404);

    if (loc.image) {
      const filePath = path.join(__dirname, "..", "public", loc.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await loc.deleteOne();
    res.json({ message: "Location deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   BOOK SLOT (PRICE CALC)
======================= */
r.post("/book/:id", auth, async (req, res) => {
  try {
    const { bookingDate, startTime, endTime } = req.body;

    if (!bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: "Date & time required" });
    }

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, availableSlots: { $gt: 0 } },
      { $inc: { availableSlots: -1 } },
      { new: true }
    );

    if (!location) {
      return res.status(400).json({ message: "No slots available" });
    }

    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const duration = endHour - startHour;

    if (duration <= 0) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    const totalAmount = duration * location.hourlyRate;
    const user = await User.findById(req.user.id);

    await Booking.create({
      bookingNumber: generateBookingNumber(),
      userId: req.user.id,
      userName: user.name,

      locationId: location._id,
      locationName: location.name,
      area: location.area,
      address: location.address,
      image: location.image,

      bookingDate,
      startTime,
      endTime,
      duration,

      hourlyRate: location.hourlyRate,
      totalAmount,

      status: "Booked"
    });

    res.json({ message: "Booking successful" });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = r;
