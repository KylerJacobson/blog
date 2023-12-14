const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const UserDao = require("../server/models/userDao");
const UserController = require("./controllers/userController");
const SessionController = require("./controllers/sessionController");
const PostController = require("./controllers/postController");
const PostDao = require("../server/models/postDao");
const MediaDao = require("../server/models/mediaDao");
const verifyToken = require("./helpers/authMiddleware");
require("dotenv").config();
const multer = require("multer");
const {
    BlobServiceClient,
    BlobSASPermissions,
    generateBlobSASQueryParameters,
} = require("@azure/storage-blob");
const MediaController = require("./controllers/mediaController");
const upload = multer({ dest: "uploads/" });

const ADMIN = 1;
const SESSION_SECRET = process.env.SessionSecret;
const COOKIE_SECURITY = process.env.CookieSecurity === "true";

const port = process.env.PORT || 8080;
const userDao = new UserDao();
const postDao = new PostDao();
const mediaDao = new MediaDao();
const userController = new UserController(userDao);
const sessionController = new SessionController(userDao);
const postController = new PostController(postDao);
const mediaController = new MediaController(mediaDao);

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

// --------------------------------------------- User Routes --------------------------------------------

app.post("/api/user", userController.create);

app.get("/api/user/list", verifyToken, (req, res) =>
    userController.list(req, res)
);

app.get("/api/user", verifyToken, (req, res) => userController.show(req, res));

app.put("/api/user", verifyToken, (req, res) =>
    userController.update(req, res)
);

app.delete("/api/user/:userId", verifyToken, (req, res) =>
    userController.destroy(req, res)
);

// ------------------------------------------- Session Routes -------------------------------------------

app.post("/api/session", (req, res) => sessionController.create(req, res));

app.delete("/api/session", (req, res) => sessionController.destroy(req, res));

// --------------------------------------------- Post Routes --------------------------------------------

app.post("/api/posts", verifyToken, (req, res) =>
    postController.create(req, res)
);

app.get("/api/posts", verifyToken, (req, res, next) =>
    postController.list(req, res, next)
);

app.get("/api/posts/:id", verifyToken, (req, res) =>
    postController.show(req, res)
);

app.put("/api/posts/:id", verifyToken, (req, res) =>
    postController.update(req, res)
);

app.delete("/api/posts/:id", verifyToken, (req, res) =>
    postController.destroy(req, res)
);

// ------------------------------------------- Media Routes -------------------------------------------

app.get("/api/media/:postId", verifyToken, (req, res) =>
    mediaController.show(req, res)
);

app.delete("/api/media/:mediaId", verifyToken, (req, res) =>
    mediaController.destroy(req, res)
);

app.post("/api/media", upload.array("photos", 10), verifyToken, (req, res) =>
    mediaController.create(req, res)
);

app.use(express.static(path.join(__dirname, "public/")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/", "index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
