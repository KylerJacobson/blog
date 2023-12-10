const UserDao = require("../models/userDao");

const ADMIN = 1;

class UserController {
    static async create(req, res) {
        const { firstName, lastName, email, password, restricted } =
            req.body.accountDetails;
        try {
            let user = await UserDao.getUserByEmail(email);
            if (user) {
                return res.status(409).json({ message: "User already exists" });
            } else {
                let userId = await UserDao.createUser(
                    firstName,
                    lastName,
                    email,
                    password,
                    restricted
                );
                if (userId) {
                    res.status(200).json({
                        message: "Account successfully created",
                    });
                }
            }
        } catch (error) {
            console.error("Internal Server Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    static async show(req, res) {
        try {
            const user = await UserDao.getUserById(req.payload.sub);
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

    static async update(req, res) {
        console.log("Updating user backend");
        let { user, role } = req.body;
        console.log(user);
        console.log(role);
        console.log("payload role: ", req.payload.role);
        if (role !== null && role !== user.role && req.payload.role === ADMIN) {
            console.log("updating role");
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
