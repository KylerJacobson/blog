const express = require("express");
const app = express();
const path = require("path");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const session = require("express-session");
const UserDao = require("../server/models/userDao");
const PostDao = require("../server/models/postDao");
const MediaDao = require("../server/models/mediaDao");
const dotenv = require("dotenv");
const verifyToken = require("./helpers/authMiddleware");
require("dotenv").config();
const multer = require("multer");
const {
    BlobServiceClient,
    BlobSASPermissions,
    generateBlobSASQueryParameters,
} = require("@azure/storage-blob");
const router = require("./router");
const upload = multer({ dest: "uploads/" }); // Temporarily stores files in the 'uploads' directory

const ADMIN = 1;
const PRIVILEGED = 2;
const NON_PRIVILEGED = 0;
const REQUESTED = -1;
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

app.use("/api", router);

// app.post(
//     "/api/deleteUserById",
//     verifyToken,
//     [check("userId", "UserId is a required integer").notEmpty().isInt()],
//     async (req, res) => {
//         const userId = req.body.userId;
//         if (req.payload.role != ADMIN) {
//             return res.status(401).json({
//                 message: "You are not authorized to delete users",
//             });
//         }
//         try {
//             const valid = UserDao.deleteUserById(userId);
//             if (!valid) {
//                 res.status(500).json({
//                     message: "Error deleting post, please try again.",
//                 });
//             }
//             res.status(200).json({ message: "Successfully deleted message" });
//         } catch (error) {
//             console.error("Internal server error");
//         }
//     }
// );

// ------------------------------------------- POST CONTROLLER -------------------------------------------
app.post(
    "/api/postCreation",
    [
        check("postData.title", "Title is a required field")
            .notEmpty()
            .trim()
            .escape(),
        check("postData.content", "Content is a required field")
            .notEmpty()
            .escape()
            .trim(),
    ],
    verifyToken,
    async (req, res) => {
        const { title, content, restricted } = req.body.postData;
        const errors = validationResult(req);

        if (req.payload.role != ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to create a post",
            });
        }

        try {
            const post = await PostDao.createPost(
                title,
                content,
                restricted,
                req.payload.sub
            );
            if (post) {
                res.status(200).json(post[0].post_id);
            }
        } catch (error) {
            res.status(500).json({ message: "error: ", error });
        }
    }
);

app.get("/api/getAllRecentPosts", verifyToken, async (req, res) => {
    if (req.payload.role != ADMIN && req.payload.role != PRIVILEGED) {
        return res.status(401).json({
            message: "You are not authorized to retrieve private posts",
        });
    }
    try {
        let posts = await PostDao.getAllRecentPosts();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "There was an error: ", error });
        console.error(error);
    }
});

app.get("/api/getPublicRecentPosts", async (req, res) => {
    try {
        let posts = await PostDao.getRecentPublicPosts();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "There was an error: ", error });
        console.error(error);
    }
});
app.get("/api/post/:postId", async (req, res, next) => {
    const { postId } = req.params;
    try {
        const post = await PostDao.getPostById(postId);
        if (!post) {
            res.status(500).json({
                message: "Error getting post, please try again.",
            });
        }
        if (post.restricted) {
            verifyToken(req, res, next);
            if (
                req.payload.role === REQUESTED ||
                req.payload.role === NON_PRIVILEGED
            ) {
                return res.status(403).json({
                    message: "You are not authorized to view this post",
                });
            }
        }

        return res.status(200).json(post);
    } catch (error) {
        console.error("Internal server error");
    }
});
app.put(
    "/api/post/:postId",
    verifyToken,
    [
        check("postData.title", "Title is a required field")
            .notEmpty()
            .trim()
            .escape(),
        check("postData.content", "Content is a required field")
            .notEmpty()
            .escape()
            .trim(),
    ],
    async (req, res) => {
        if (req.payload.role != ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to update a post",
            });
        }
        const { postId } = req.params;
        const errors = validationResult(req);
        const { title, content, restricted } = req.body.postData;

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const post = PostDao.updatedPost(
                title,
                content,
                restricted,
                req.payload.sub,
                postId
            );
            if (post) {
                res.status(200).json({ message: "Post updated" });
            }
        } catch (error) {
            console.error(error);
        }
    }
);

app.post(
    "/api/deletePostById",
    verifyToken,
    [check("postId", "PostId is a required integer").notEmpty().isInt()],
    async (req, res) => {
        const postId = req.body.postId;
        if (req.payload.role != ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to delete a post",
            });
        }
        try {
            const valid = PostDao.deletePostById(postId);
            if (!valid) {
                res.status(500).json({
                    message: "Error deleting post, please try again.",
                });
            }
            res.status(200).json({ message: "Successfully deleted message" });
        } catch (error) {
            console.error("Internal server error");
        }
    }
);

// ------------------------------------------- ACCOUNT CONTROLLER -------------------------------------------
app.post(
    "/api/accountCreation",
    [
        check("accountDetails.firstName", "First name is a required field")
            .notEmpty()
            .escape()
            .trim(),
        check("accountDetails.lastName", "Last name is a required field")
            .notEmpty()
            .escape()
            .trim(),
        check("accountDetails.email", "Email is a required field")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        check("accountDetails.password", "Password is a required field")
            .notEmpty()
            .escape()
            .trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { firstName, lastName, email, password, restricted } =
            req.body.accountDetails;
        try {
            let user = await UserDao.getUserByEmail(email);
            if (user) {
                return res.status(409).json({ message: "User already exists" });
            } else {
                let userId = await UserDao.createUser(
                    firstName,
                    lastName,
                    email,
                    password,
                    restricted
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
    }
);

app.post(
    "/api/signIn",
    [
        check("formData.email", "A valid email is a required field")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        check("formData.password", "Password is a required field")
            .notEmpty()
            .escape()
            .trim(),
    ],
    async (req, res) => {
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
    }
);

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

// ------------------------------------------- MEDIA CONTROLLER -------------------------------------------
app.get("/api/getPublicMedia/:postId", async (req, res, next) => {
    const { postId } = req.params;
    try {
        const media = await MediaDao.getMediaByPostId(postId);
        for (i in media) {
            if (media[i].restricted === true) {
                return res.status(403).json({
                    message: "You are not authorized to view this media",
                });
            }
        }
        return res.status(200).json(media);
    } catch (error) {
        console.error(`Internal server error: ${error.message}`);
        return res.status(500).json({
            message: "Internal server error while retrieving media",
        });
    }
});

app.get("/api/getPrivateMedia/:postId", verifyToken, async (req, res, next) => {
    if (req.payload.role != ADMIN && req.payload.role != PRIVILEGED) {
        return res.status(403).json({
            message: "You are not authorized to retrieve private media",
        });
    }
    const { postId } = req.params;
    try {
        const media = await MediaDao.getMediaByPostId(postId);
        return res.status(200).json(media);
    } catch (error) {
        console.error(`Internal server error: ${error.message}`);
        return res.status(500).json({
            message: "Internal server error while retrieving media",
        });
    }
});

app.post("/api/media/delete", async (req, res, next) => {
    const postId = req.body.postId;
    const mediaId = req.body.mediaId;
    try {
        const media = await MediaDao.deleteMediaByMediaId(mediaId);
        return res.status(200).json({
            message: `Media ${mediaId} was successfully deleted`,
        });
    } catch (error) {
        console.error(`Internal server error: ${error.message}`);
        return res.status(500).json({
            message: "Internal server error while retrieving media",
        });
    }
});
// const LOCAL_API = {
//     ROOT_PATH: "/api",
//     MEDIA: "/media",

// }
// const { MEDIA } = LOCAL_API

// @todo update to /api/media
// app.post(`${LOCAL_API.ROOT_PATH}${LOCAL_API.MEDIA}`)
app.post("/upload", upload.array("photos", 10), async (req, res) => {
    // if (req.payload.role != ADMIN) {
    //     return res.status(403).json({
    //         message: "You are not authorized to upload media",
    //     });
    // }
    const files = req.files;
    const postId = req.body.postId;
    const restricted = req.body.restricted;
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );

    try {
        const containerClient = blobServiceClient.getContainerClient("media");
        for (const file of files) {
            const blobName = `blog-media/${file.originalname}`;
            const blockBlobClient =
                containerClient.getBlockBlobClient(blobName);
            const uploadBlobResponse = await blockBlobClient.uploadFile(
                file.path
            );
            let mediaInstance = await MediaDao.uploadMedia(
                postId,
                blobName,
                file.mimetype,
                restricted
            );
        }

        res.status(200).json({
            message: "File uploaded to Azure Blob storage.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error uploading the file." });
    }
});
app.post("/api/mediaSAS", async (req, res) => {
    const { blobName } = req.body;
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient("media");
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const sasOptions = {
        containerName: "media",
        blobName: blobName,
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 86400),
        permissions: BlobSASPermissions.parse("r"),
    };

    const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        blobServiceClient.credential
    ).toString();
    const blobSasUrl = `${blockBlobClient.url}?${sasToken}`;
    return res.status(200).json({ blobSasUrl });
});
app.use(express.static(path.join(__dirname, "public/")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/", "index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
