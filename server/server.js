const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const multer = require("multer");
require("dotenv").config();

const UserDao = require("../server/models/userDao");
const PostDao = require("../server/models/postDao");
const MediaDao = require("../server/models/mediaDao");
const UserController = require("./controllers/userController");
const SessionController = require("./controllers/sessionController");
const PostController = require("./controllers/postController");
const MediaController = require("./controllers/mediaController");
const verifyToken = require("./helpers/authMiddleware");

const SESSION_SECRET = process.env.SessionSecret;
const COOKIE_SECURITY = process.env.CookieSecurity === "true";
const upload = multer({ dest: "uploads/" });
const port = process.env.PORT || 8080;
const userDao = new UserDao();
const postDao = new PostDao();
const mediaDao = new MediaDao();
const userController = new UserController(userDao);
const sessionController = new SessionController(userDao);
const postController = new PostController(postDao);
const mediaController = new MediaController(mediaDao);

const LOCAL_API = "/api";
const USER_PATH = "/user";
const MEDIA_PATH = "/media";
const SESSION_PATH = "/session";
const POST_PATH = "/posts";

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

app.post(`${LOCAL_API}${USER_PATH}`, (req, res) =>
    userController.create(req, res)
);

app.get(`${LOCAL_API}${USER_PATH}/list`, verifyToken, (req, res) =>
    userController.list(req, res)
);

app.get(`${LOCAL_API}${USER_PATH}`, verifyToken, (req, res) =>
    userController.show(req, res)
);

app.put(`${LOCAL_API}${USER_PATH}`, verifyToken, (req, res) =>
    userController.update(req, res)
);

app.delete(`${LOCAL_API}${USER_PATH}/:userId`, verifyToken, (req, res) =>
    userController.destroy(req, res)
);

// ------------------------------------------- Session Routes -------------------------------------------

app.post(`${LOCAL_API}${SESSION_PATH}`, (req, res) =>
    sessionController.create(req, res)
);

app.delete(`${LOCAL_API}${SESSION_PATH}`, (req, res) =>
    sessionController.destroy(req, res)
);

// --------------------------------------------- Post Routes --------------------------------------------

app.post(`${LOCAL_API}${POST_PATH}`, verifyToken, (req, res) =>
    postController.create(req, res)
);

app.get(`${LOCAL_API}${POST_PATH}`, verifyToken, (req, res, next) =>
    postController.list(req, res, next)
);

app.get(`${LOCAL_API}${POST_PATH}/:id`, verifyToken, (req, res) =>
    postController.show(req, res)
);

app.put(`${LOCAL_API}${POST_PATH}/:id`, verifyToken, (req, res) =>
    postController.update(req, res)
);

app.delete(`${LOCAL_API}${POST_PATH}/:id`, verifyToken, (req, res) =>
    postController.destroy(req, res)
);

// ------------------------------------------- Media Routes -------------------------------------------

app.get(`${LOCAL_API}${MEDIA_PATH}/:postId`, verifyToken, (req, res) =>
    mediaController.show(req, res)
);

app.delete(`${LOCAL_API}${MEDIA_PATH}/:mediaId`, verifyToken, (req, res) =>
    mediaController.destroy(req, res)
);

app.post(
    `${LOCAL_API}${MEDIA_PATH}`,
    upload.array("photos", 10),
    verifyToken,
    (req, res) => mediaController.create(req, res)
);

app.use(express.static(path.join(__dirname, "public/")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/", "index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
