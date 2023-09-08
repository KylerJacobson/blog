const express = require("express");
const app = express();
const path = require("path");
const { Pool } = require("pg");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const session = require("express-session");
const UserDao = require("../server/models/userDao");

const JWT_SECRET = process.env.JWTSecret;
const SESSION_SECRET = process.env.SessionSecret;
const COOKIE_SECURITY = process.env.CookieSecurity === "true";
const port = process.env.PORT || 8080;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public/")));

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            secure: COOKIE_SECURITY,
            maxAge: 3600000,
        },
    })
);

const verifyToken = (req, res, next) => {
    const token = req.session.token;
    if (token) {
        jwt.verify(
            token,
            JWT_SECRET,
            { algorithms: ["HS256"] },
            (error, payload) => {
                if (error) {
                    console.error(error);
                    if (error.name === "TokenExpiredError") {
                        return res
                            .status(401)
                            .json({ message: "Unauthorized: Token expired" });
                    } else {
                        return res
                            .status(401)
                            .json({ message: "Unauthorized: Invalid token" });
                    }
                }
                req.payload = payload;
                next();
            }
        );
    } else {
        res.status(401).send("Unauthorized: No token provided");
    }
};

app.get("/api/getUser", verifyToken, async (req, res) => {
    const userId = req.payload.sub;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await UserDao.getUserById(userId);
        if (user == false) {
            return res.status(404).json({ message: "User not found" });
        } else {
            return res.status(200).json(user);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/accountCreation", async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { firstName, lastName, email, password } = req.body.accountDetails;
    try {
        let user = await UserDao.getUserByEmail(email);
        if (user) {
            return res.status(409).json({ message: "User already exists" });
        } else {
            let userId = await UserDao.createUser(
                firstName,
                lastName,
                email,
                password
            );
            if (userId) {
                res.status(200).json({
                    message: "Account successfully created",
                });
            }
        }
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/api/signIn", async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body.formData;

    try {
        const user = await UserDao.loginUser(email, password);

        if (user == false) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        const token = jwt.sign(
            {
                iss: "kylerjacobson.dev",
                aud: "kylerjacobson.dev",
                sub: user.id,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: "1hr" }
        );

        req.session.token = token;
        return res.json(token);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res
                .status(500)
                .json({ message: "Error logging out, try again" });
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout was successful" });
    });
});

app.use(express.static(path.join(__dirname, "public/")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/", "index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
