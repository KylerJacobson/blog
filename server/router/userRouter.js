const { Router } = require("express");
const userRouter = Router();
const UserController = require("../controllers/userController");
const verifyToken = require("../helpers/authMiddleware");

// ------------------------------------------- Create User -------------------------------------------

// /api/user
userRouter.post("/", (req, res, next) => {
    console.log("CREATING USER");
});
// ------------------------------------------- Read User(s) -------------------------------------------
userRouter.get("/list", verifyToken, UserController.list);

userRouter.get("/:userId", verifyToken, UserController.show);

// ------------------------------------------- Update User -------------------------------------------
// Doesn't need userId
userRouter.put("/:userId", verifyToken, UserController.update);

// ------------------------------------------- Delete User -------------------------------------------
userRouter.delete("/:userId", verifyToken, UserController.destroy);

module.exports = userRouter;
