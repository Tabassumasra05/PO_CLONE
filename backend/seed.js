const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const connectDB = require("./db");

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const adminExists = await User.findOne({ username: "admin" });

        if (adminExists) {
            console.log("Admin user already exists");
            process.exit();
        }

        const adminUser = new User({
            username: "admin",
            password: "adminpassword123", // Will be hashed by pre-save hook
            role: "admin",
        });

        await adminUser.save();
        console.log("Admin user seeded successfully");
        process.exit();
    } catch (err) {
        console.error("Error seeding admin:", err.message);
        process.exit(1);
    }
};

seedAdmin();
