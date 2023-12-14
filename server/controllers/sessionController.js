const UserDao = require("../models/userDao");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWTSecret;
require("dotenv").config();

class SessionController {
    constructor(userDao) {
        this.userDao = userDao;
    }
    async create(req, res) {
        const { email, password } = req.body.formData;
        try {
            const user = await this.userDao.loginUser(email, password);
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
            return res.status(200).json(token);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async destroy(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res
                    .status(500)
                    .json({ message: "Error logging out, try again" });
            }
            res.clearCookie("connect.sid");
            res.status(200).json({ message: "Logout was successful" });
        });
    }
}

module.exports = SessionController;
