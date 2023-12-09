const { Router } = require("express");
const userRouter = Router();

// ------------------------------------------- Create User -------------------------------------------

// /api/user
userRouter.post("/", (req, res, next) => {
    console.log("CREATING USER");
});
// ------------------------------------------- Read User -------------------------------------------
userRouter.get("/", (req, res, next) => {
    console.log("GETTING USER");
    next();
});
// ------------------------------------------- Update User -------------------------------------------
userRouter.put("/", (req, res, next) => {
    console.log("UPDATING USER");
});
// ------------------------------------------- Delete User -------------------------------------------
userRouter.delete("/", (req, res, next) => {
    console.log("DELETING USER");
});

module.exports = userRouter;
