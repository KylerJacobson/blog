const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

class User {
    constructor(firstName, lastName, email, role, id) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.id = id;
    }
}

class UserDao {
    async getUserByEmail(email) {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (rows.length === 0) return null;
        return new User(
            rows[0].first_name,
            rows[0].last_name,
            rows[0].email,
            rows[0].role,
            rows[0].id
        );
    }

    async getUserById(id) {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
            id,
        ]);
        if (rows.length === 0) return null;
        return new User(
            rows[0].first_name,
            rows[0].last_name,
            rows[0].email,
            rows[0].role,
            rows[0].id
        );
    }

    async getAllUsers() {
        const { rows } = await pool.query(
            "SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at ASC"
        );
        if (rows.length === 0) return [];
        return rows;
    }

    async getUsersByRole(role) {
        const { rows } = await pool.query(
            "SELECT id, first_name, last_name, email, role, created_at FROM users WHERE role = $1",
            [role]
        );
        if (rows.length === 0) return [];
        return rows;
    }

    async updateUser(id, firstName, lastName, email, role) {
        try {
            const { rows } = await pool.query(
                "UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE id = $5",
                [firstName, lastName, email, role, id]
            );
            return rows;
        } catch (error) {
            console.error(`Error inserting into posts: ${error}`);
        }
    }

    async createUser(firstName, lastName, email, password, accessRequest) {
        let access = 0;
        if (accessRequest) {
            access = -1;
        }
        const { rows } = await pool.query(
            "INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, crypt($4, gen_salt('bf', 8)), $5) RETURNING *",
            [firstName, lastName, email, password, access]
        );
        return rows[0].id;
    }

    async deleteUserById(userId) {
        try {
            const { rows } = await pool.query(
                "DELETE FROM users WHERE id = $1",
                [userId]
            );
            if (rows === 0) {
                return false;
            }
            return true;
        } catch (error) {
            console.error(`Error deleting from users: ${error}`);
        }
    }

    async loginUser(email, password) {
        const { rows } = await pool.query(
            "SELECT (password = crypt($1, password)) AS isMatch FROM users WHERE email = $2",
            [password, email]
        );
        if (rows[0]?.ismatch === true) {
            const user = await this.getUserByEmail(email);
            return user;
        } else {
            return false;
        }
    }
}

module.exports = UserDao;
