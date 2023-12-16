const { ROLE } = require("../constants/roleConstants");

class PostController {
    constructor(postDao) {
        this.postDao = postDao;
    }

    async create(req, res) {
        const { title, content, restricted } = req.body.postData;
        if (req.payload.role != ROLE.ADMIN) {
            return res.status(403).json({
                message: "You are not authorized to create a post",
            });
        }

        try {
            const post = await this.postDao.createPost(
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

    async list(req, res, next) {
        if (
            (req.isAuthenticated && req?.payload?.role === ROLE.ADMIN) ||
            req?.payload?.role === ROLE.PRIVILEGED
        ) {
            try {
                let posts = await this.postDao.getAllRecentPosts();
                res.status(200).json(posts);
            } catch (error) {
                res.status(500).json({
                    message: "There was an error: ",
                    error,
                });
                console.error(error);
            }
        } else {
            try {
                let posts = await this.postDao.getRecentPublicPosts();
                res.status(200).json(posts);
            } catch (error) {
                res.status(500).json({
                    message: "There was an error: ",
                    error,
                });
                console.error(error);
            }
        }
    }

    async show(req, res, next) {
        const { id } = req.params;
        const role = req?.payload?.role;
        try {
            const post = await this.postDao.getPostById(id);
            if (!post) {
                res.status(500).json({
                    message: "Error getting post, please try again.",
                });
            }

            if (post.restricted) {
                if (
                    req.isAuthenticated === false ||
                    (role !== ROLE.ADMIN && role !== ROLE.PRIVILEGED)
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
    }

    async update(req, res) {
        if (req.payload.role != ROLE.ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to update a post",
            });
        }
        const { id } = req.params;
        const { title, content, restricted } = req.body.postData;

        try {
            const post = await this.postDao.updatePost(
                title,
                content,
                restricted,
                req.payload.sub,
                id
            );
            if (post) {
                res.status(200).json({ message: "Post updated" });
            }
        } catch (error) {
            console.error(error);
        }
    }

    async destroy(req, res) {
        const { id } = req.params;
        if (req.payload.role != ROLE.ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to delete a post",
            });
        }
        try {
            const valid = this.postDao.deletePostById(id);
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
}

module.exports = PostController;
