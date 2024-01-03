const { ROLE } = require("../constants/roleConstants");

class UserController {
    constructor(userDao) {
        this.userDao = userDao;
    }

    async create(req, res) {
        const {
            firstName,
            lastName,
            email,
            password,
            restricted,
            emailNotification,
        } = req.body.accountDetails;
        try {
            let user = await this.userDao.getUserByEmail(email);
            if (user) {
                return res.status(409).json({ message: "User already exists" });
            } else {
                let userId = await this.userDao.createUser(
                    firstName,
                    lastName,
                    email,
                    password,
                    restricted,
                    emailNotification
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

    async show(req, res) {
        if (req.isAuthenticated) {
            const userId = req.payload.sub;
            try {
                const user = await this.userDao.getUserById(userId);
                if (user == false) {
                    return res.status(404).json({ message: "User not found" });
                } else {
                    return res.status(200).json(user);
                }
            } catch (error) {
                res.status(500).send(error.message);
            }
        }
        return res.status(403).json({ message: "User not authenticated " });
    }

    async list(req, res) {
        if (req?.payload?.role != ROLE.ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to retrieve all users",
            });
        }
        try {
            const users = await this.userDao.getAllUsers();
            if (users.length === 0) {
                return res.status(404).json({ message: "Users not found" });
            } else {
                return res.status(200).json(users);
            }
        } catch (error) {
            res.status(500).send(error.message);
        }
    }

    async update(req, res) {
        let { user, role } = req.body;
        if (
            role !== null &&
            role !== user.role &&
            req.payload.role === ROLE.ADMIN
        ) {
            user.role = role;
        }

        try {
            let updatedUser = await this.userDao.updateUser(
                user.id,
                user.first_name,
                user.last_name,
                user.email,
                user.role,
                user.email_notification
            );
            if (updatedUser) {
                return res.status(200).json(updatedUser);
            } else {
                return res.status(500).json({ message: "Error updating role" });
            }
        } catch (error) {
            res.status(500).send(error.message);
        }
    }

    async destroy(req, res) {
        const userId = req.params.userId;
        if (req.payload.role != ROLE.ADMIN) {
            return res.status(401).json({
                message: "You are not authorized to delete users",
            });
        }
        try {
            const valid = this.userDao.deleteUserById(userId);
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
