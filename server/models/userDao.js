const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

class User {
    constructor(firstName, lastName, email, verified) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.verified = verified;
    }
}

class UserDao {
    static async getUserByEmail(email) {
        console.log("in getUserByEmail");
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (rows.length === 0) return null;
        return new User(
            rows[0].first_name,
            rows[0].last_name,
            rows[0].email,
            rows[0].verified
        );
    }

    static async createUser(firstName, lastName, email, password) {
        console.log("in createUser");
        const newUser = await pool.query(
            "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, crypt($4, gen_salt('bf', 8))) RETURNING *",
            [firstName, lastName, email, password]
        );
        console.log(newUser);
        return newUser;
    }

    static async loginUser(email, password) {
        console.log("in loginUser");
        const { rows } = await pool.query(
            "SELECT (password = crypt($1, password)) AS isMatch FROM users WHERE email = $2",
            [password, email]
        );
        console.log("rows: ", rows);
        if (rows[0]?.ismatch === true) {
            const user = await this.getUserByEmail(email);
            return user;
        } else {
            return false;
        }
    }
}

module.exports = UserDao;
