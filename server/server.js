const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.send({ message: "Hello from Github Actions!" });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
