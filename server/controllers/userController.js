const { Router } = require("express");
const verifyToken = require("../helpers/authMiddleware");
const UserDao = require("../models/userDao");

const ADMIN = 1;

class UserController {
    static async create(req, res) {
        console.log("Creating A USER");
    }

    static async show(req, res) {
        const userId = req.payload.sub;

        try {
            const user = await UserDao.getUserById(userId);
            if (user == false) {
                return res.status(404).json({ message: "User not found" });
            } else {
                return res.status(200).json(user);
            }
        } catch (error) {
            res.status(500).send(error.message);
        }
    }

    static async list(req, res) {
        if (req.payload.role != ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to retrieve all users",
            });
        }
        try {
            const users = await UserDao.getAllUsers();
            if (users.length === 0) {
                return res.status(404).json({ message: "Users not found" });
            } else {
                return res.status(200).json(users);
            }
        } catch (error) {
            res.status(500).send(error.message);
        }
    }

    // app.post("/api/completeUserAccessRequest", verifyToken, async (req, res) => {

    // });

    static async update(req, res) {
        let { user, role } = req.body;
        if (role && role !== user.role && req.payload.role === ADMIN) {
            user.role = role;
        }

        try {
            let response = await UserDao.updateUser(
                user.id,
                user.first_name,
                user.last_name,
                user.email,
                user.role
            );
            if (response) {
                return res
                    .status(200)
                    .json({ message: "Successfully updated role" });
            } else {
                return res.status(500).json({ message: "Error updating role" });
            }
        } catch (error) {
            res.status(500).send(error.message);
        }
    }

    static async destroy(req, res) {
        const userId = req.params.userId;
        if (req.payload.role != ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to delete users",
            });
        }
        try {
            const valid = UserDao.deleteUserById(userId);
            if (!valid) {
                res.status(500).json({
                    message: "Error deleting post, please try again.",
                });
            }
            res.status(200).json({ message: "Successfully deleted message" });
        } catch (error) {
            console.error("Internal server error");
        }
    }
}

module.exports = UserController;
