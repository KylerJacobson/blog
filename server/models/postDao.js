const { Pool } = require("pg");
const dotenv = require("dotenv");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

class PostDao {
    async createPost(title, content, restricted, userId) {
        try {
            const { rows } = await pool.query(
                "INSERT INTO posts (title, content, restricted, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
                [title, content, restricted, userId]
            );
            return rows;
        } catch (error) {
            console.error(`Error inserting into posts: ${error}`);
        }
    }

    async updatePost(title, content, restricted, userId, postId) {
        try {
            const { rows } = await pool.query(
                "UPDATE posts SET title = $1, content = $2, restricted = $3, user_id = $4 WHERE post_id = $5 RETURNING *",
                [title, content, restricted, userId, postId]
            );
            return rows;
        } catch (error) {
            console.error(`Error inserting into posts: ${error}`);
        }
    }

    async getRecentPublicPosts() {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM posts WHERE restricted = false ORDER BY created_at DESC LIMIT 10"
            );
            return rows;
        } catch (error) {
            console.error(`Error inserting into posts: ${error}`);
        }
    }

    async getAllRecentPosts() {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM posts ORDER BY created_at DESC LIMIT 10"
            );
            return rows;
        } catch (error) {
            console.error(`Error inserting into posts: ${error}`);
        }
    }

    async deletePostById(postId) {
        try {
            const { rows } = await pool.query(
                "DELETE FROM posts WHERE post_id = $1",
                [postId]
            );
            if (rows === 0) {
                return false;
            }
            return true;
        } catch (error) {
            console.error(`Error deleting from posts: ${error}`);
        }
    }

    async getPostById(postId) {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM posts WHERE post_id = $1",
                [postId]
            );
            if (rows === 0) {
                return false;
            }
            return rows[0];
        } catch (error) {
            console.error(`Error getting from posts: ${error}`);
        }
    }
}

module.exports = PostDao;
