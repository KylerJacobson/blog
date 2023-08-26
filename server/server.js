const express = require("express");
const app = express();
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");

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
    // At this point, if the JWT was invalid, express-jwt would have thrown an error and this code wouldn't be reached

    // You can access the decoded payload using req.user. For example: req.user.id or req.user.email

    res.json({ data: "Protected Data" });
});

app.post("/api/accountCreation", async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { firstName, lastName, email, password } = req.body;
    try {
        let user = await pool.query("SELECT * FROM users WHERE email = $1", [
            email,
        ]);

        if (user.rows.length > 0) {
            return res.status(401).json("User already exists");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
            [firstName, lastName, email, hashedPassword]
        );
        res.status(200).send("Account successfully created");
    } catch (error) {
        console.log(error);
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
        let user = await pool.query(
            "SELECT first_name, last_name, email, password, verified FROM users WHERE email = $1",
            [email]
        );
        console.log(user.rows[0].email);
        if (user.rows.length === 0) {
            return res.status(401).json("Invalid Credentials");
        }
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(401).json("Invalid Credentials");
        }
        // @follow-up is there a better way to do this
        const temp = {
            first_name: user.rows[0].first_name,
            last_name: user.rows[0].last_name,
            email: user.rows[0].email,
            verified: user.rows[0].verified,
        };
        const token = jwt.sign(temp, JWT_SECRET, { expiresIn: "1h" });
        return res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.get("/api/test", async (req, res) => {
    try {
        const allItems = await pool.query("SELECT * FROM test");
        res.json({ allItems });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

app.use(express.static(path.join(__dirname, "public/")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/", "index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
