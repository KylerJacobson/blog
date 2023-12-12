const PostDao = require("../models/postDao");

class PostController {
    constructor(postDao) {
        this.postDao = postDao;
    }

    async create(req, res) {
        const { title, content, restricted } = req.body.postData;
        const errors = validationResult(req);

        if (req.payload.role != ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to create a post",
            });
        }

        try {
            const post = await this.PostDao.createPost(
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
}
