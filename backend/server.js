require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const connectDB = require("./db");
const User = require("./models/User");
const { auth, admin } = require("./middleware/auth");


const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// @route   POST /api/auth/register
// @desc    Register a user
app.post("/api/auth/register", async (req, res) => {
    const { username, password, role } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: "User already exists" });

        user = new User({ username, password, role });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
app.get("/api/admin/users", auth, admin, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/user/profile
// @desc    Get current user profile
app.get("/api/user/profile", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
app.put("/api/user/profile", auth, async (req, res) => {
    const { username } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (username) user.username = username;
        await user.save();

        res.json({ id: user._id, username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/user/favorites
// @desc    Toggle a car model in favorites
app.post("/api/user/favorites", auth, async (req, res) => {
    const { carId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const index = user.favorites.indexOf(carId);
        if (index > -1) {
            user.favorites.splice(index, 1); // Remove if exists
        } else {
            user.favorites.push(carId); // Add if doesn't exist
        }
        await user.save();
        res.json(user.favorites);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});