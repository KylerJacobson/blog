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
                    req.isAuthenticated = false;
                    next();
                } else {
                    req.isAuthenticated = true;
                    req.payload = payload;
                    next();
                }
            }
        );
    } else {
        req.isAuthenticated = false;
        next();
    }
};

module.exports = verifyToken;
