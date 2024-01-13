import React, { useEffect, useState } from "react";
import axios from "axios";
import convertUtcToLocal from "../helpers/helpers";

import { ROLE } from "../constants/roleConstants";

const UserAdminTable = () => {
    const [data, setData] = useState([]);
    const fetchUsers = async () => {
        const response = await axios.get("/api/user/list", {
            withCredentials: true,
        });
        setData(response.data);
    };

    const handleRequest = async (user, role) => {
        try {
            const response = await axios.put(`/api/user`, {
                user: user,
                role: role,
            });
            if (response.status === 200) {
                fetchUsers();
            }
        } catch (error) {
            console.error("There was an error handling the access request");
        }
    };
    const deleteUser = async (userId) => {
        try {
            const response = await axios.delete(`/api/user/${userId}`);
            if (response.status === 200) {
                fetchUsers();
            }
        } catch (error) {
            console.error("There was an error deleting the user");
        }
    };

    const formatRole = (role) => {
        switch (role) {
            case -1:
                return "Access Requested";
            case 0:
                return "Non-Privileged";
            case 1:
                return "Admin";
            case 2:
                return "Privileged";
            default:
                return "default";
        }
    };
    useEffect(() => {
        fetchUsers();
    }, []);
    return (
        <table className="min-w-full bg-white border border-gray-300">
            <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Notifications</th>
                    <th>Account Creation Date</th>
                    <th></th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>
            <tbody className="text-gray-700">
                {data?.map((user, index) => (
                    <tr
                        className={
                            user.role === ROLE.REQUESTED
                                ? "bg-yellow-200"
                                : "even:bg-gray-200 odd:bg-gray-100 "
                        }
                        key={index}
                    >
                        <td>
                            {user.first_name} {user.last_name}
                        </td>
                        <td>{user.email}</td>
                        <td>{formatRole(user.role)}</td>
                        <td>{user.email_notification && "Enabled"}</td>
                        <td>{convertUtcToLocal(user.created_at)}</td>
                        <td>
                            {user.role !== ROLE.ADMIN && (
                                <button
                                    className="p-1 min-w-0 bg-indigo-500 hover:bg-indigo-700 text-white text-xl rounded-md"
                                    onClick={() =>
                                        handleRequest(user, ROLE.PRIVILEGED)
                                    }
                                >
                                    Approve
                                </button>
                            )}
                        </td>
                        <td>
                            {user.role !== ROLE.ADMIN && (
                                <button
                                    className="p-1 min-w-0 bg-red-600 hover:bg-red-900 text-white text-xl rounded-md"
                                    onClick={() =>
                                        handleRequest(user, ROLE.NON_PRIVILEGED)
                                    }
                                >
                                    Deny
                                </button>
                            )}
                        </td>
                        <td>
                            {user.role !== ROLE.ADMIN && (
                                <button
                                    className="p-1 min-w-0 bg-red-600 hover:bg-red-900 text-white text-xl rounded-md"
                                    onClick={() => deleteUser(user.id)}
                                >
                                    Delete User
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default UserAdminTable;
