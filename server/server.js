const express = require("express");
const app = express();
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: "../.env" });

const port = process.env.PORT || 8080;

const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

app.get("/api/test", async (req, res) => {
    try {
        const allItems = await pool.query("SELECT * FROM test");
        res.json({ allItems });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

app.use(express.static(path.join(__dirname, "public/")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/", "index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
