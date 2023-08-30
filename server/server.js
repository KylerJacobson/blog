const express = require("express");
const app = express();
const path = require("path");
const { Pool } = require("pg");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const UserDao = require("../server/models/userDao");

const JWT_SECRET = process.env.JWTSecret;
const port = process.env.PORT || 8080;

const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public/")));

app.use(
    "/protected-route",
    ejwt({ secret: JWT_SECRET, algorithms: ["HS256"] })
);
app.get("/protected-route", (req, res) => {
    res.json({ data: "Protected Data" });
});

app.post("/api/accountCreation", async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { firstName, lastName, email, password } = req.body;
    try {
        let user = await UserDao.getUserByEmail(email);
        if (!user) {
            return res.status(401).json("User already exists");
        }

        let newUser = await UserDao.createUser(
            firstName,
            lastName,
            email,
            password
        );

        res.status(200).send("Account successfully created");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/signIn", async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const user = await UserDao.loginUser(email, password);
        if (user == false) {
            return res.status(401).json("Invalid Credentials");
        } else {
            const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: "1h" });
            return res.json({ token });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.use(express.static(path.join(__dirname, "public/")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/", "index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
