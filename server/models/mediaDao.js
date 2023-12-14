const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

class MediaDao {
    async uploadMedia(postId, blobName, contentType, restricted) {
        try {
            const { rows } = await pool.query(
                "INSERT INTO media (post_id, blob_name, content_type, restricted) VALUES ($1, $2, $3, $4) RETURNING *",
                [postId, blobName, contentType, restricted]
            );
            return rows;
        } catch (error) {
            throw new Error(
                `Error uploading media for post ID ${postId}: ${error.message}`
            );
        }
    }

    async getMediaByPostId(postId) {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM media WHERE post_id = $1",
                [postId]
            );
            return rows;
        } catch (error) {
            throw new Error(
                `Error retrieving media for post ID ${postId}: ${error.message}`
            );
        }
    }

    async deleteMediaByMediaId(id) {
        try {
            const { rowCount } = await pool.query(
                "DELETE FROM media where id = $1",
                [id]
            );
            return rowCount > 0;
        } catch (error) {
            throw new Error(
                `Error deleting media with ID ${id}: ${error.message}`
            );
        }
    }

    static async deleteMediaByPostId(postId) {
        try {
            const { rowCount } = await pool.query(
                "DELETE FROM media where postId = $1",
                [postId]
            );
            return rowCount > 0;
        } catch (error) {
            throw new Error(
                `Error deleting associated media from postID ${postId}: ${error.message}`
            );
        }
    }
}

module.exports = MediaDao;
