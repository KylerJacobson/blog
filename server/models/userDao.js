const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../../etc/secrets/.env"),
});

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
    static async getUserByEmail(email) {
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

    static async getUserById(id) {
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

    static async createUser(firstName, lastName, email, password) {
        const { rows } = await pool.query(
            "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, crypt($4, gen_salt('bf', 8))) RETURNING *",
            [firstName, lastName, email, password]
        );
        return rows[0].id;
    }

    static async loginUser(email, password) {
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
