const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

class PostDao {
    static async createPost(title, content, restricted, userId) {
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

    static async getRecentPublicPosts() {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM posts WHERE restricted = false ORDER BY created_at DESC LIMIT 10"
            );
            return rows;
        } catch (error) {
            console.error(`Error inserting into posts: ${error}`);
        }
    }

    static async getAllRecentPosts() {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM posts ORDER BY created_at DESC LIMIT 10"
            );
            return rows;
        } catch (error) {
            console.error(`Error inserting into posts: ${error}`);
        }
    }

    static async deletePostById(postId) {
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
}

module.exports = PostDao;
