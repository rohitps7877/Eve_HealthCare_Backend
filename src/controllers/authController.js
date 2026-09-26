import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).send("Name, email and password are required");
        }

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).send("Name, email and password must be strings");
        }

        if (password.length < 6) {
            return res.status(400).send("Password must be at least 6 characters");
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (existingUser) {
            return res.status(400).send("Email already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword
            }
        });

        console.log(`User registered: ${user.email}`);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.log("Signup error:", err);
        res.status(500).send("Internal server error");
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Email and password are required");
        }

        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).send("Email and password must be strings");
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(401).send("Invalid email or password");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send("Invalid email or password");
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        console.log(`User logged in: ${user.email}`);

        res.status(200).json({
            message: "Login successful",
            token: token
        });

    } catch (err) {
        console.log("Login error:", err);
        res.status(500).send("Internal server error");
    }
};

const profile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.status(200).json(user);

    } catch (err) {
        console.log("Profile error:", err);
        res.status(500).send("Internal server error");
    }
};

export {
    signup,
    login,
    profile
};