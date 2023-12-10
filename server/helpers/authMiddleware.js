const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWTSecret;

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

module.exports = verifyToken;
