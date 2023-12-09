const Router = require("express");

const userRouter = require("./user");

const router = Router();
router.use("/user", userRouter);
// router.use("/", (req, res, next) => {
//     next();
// });

module.exports = router;
