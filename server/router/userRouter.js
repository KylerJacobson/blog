const { Router } = require("express");
const userRouter = Router();
const UserController = require("../controllers/userController");
const verifyToken = require("../helpers/authMiddleware");

userRouter.post("/", UserController.create);

userRouter.get("/list", verifyToken, UserController.list);

userRouter.get("/", verifyToken, UserController.show);

userRouter.put("/", verifyToken, UserController.update);

userRouter.delete("/:userId", verifyToken, UserController.destroy);

module.exports = userRouter;
