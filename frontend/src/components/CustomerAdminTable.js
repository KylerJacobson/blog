import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment-timezone";
import {
    NON_PRIVILEGED,
    PRIVILEGED,
    REQUESTED,
} from "../constants/roleConstants";

const CustomerAdminTable = () => {
    const [data, setData] = useState([]);
    const fetchUsers = async () => {
        const response = await axios.get("/api/getUsers", {
            withCredentials: true,
        });
        setData(response.data);
    };

    const handleRequest = async (id, role) => {
        try {
            const response = await axios.post(
                "/api/completeUserAccessRequest",
                {
                    id: id,
                    role: role,
                }
            );
            if (response.status === 200) {
                fetchUsers();
            }
        } catch (error) {
            console.error("There was an error handling the access request");
        }
    };
    const deleteUser = async (userId) => {
        try {
            const response = await axios.post("/api/deleteUserById", {
                userId,
            });
            if (response.status === 200) {
                fetchUsers();
            }
        } catch (error) {
            console.error("There was an error deleting the user");
        }
    };
    const formatDate = (dateTime) => {
        //@follow-up Why is the PostgreSQL server UTC + 6 hours?
        let tempDate = new Date(dateTime);
        tempDate.setHours(tempDate.getHours() - 6);
        const formattedDate = moment(tempDate).format("MM/DD/YYYY HH:mm");
        return formattedDate;
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
                    <th>Account Creation Date</th>
                    <th></th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>
            <tbody className="text-gray-700">
                {data?.map((customer, index) => (
                    <tr
                        className={
                            customer.role === REQUESTED
                                ? "bg-yellow-200"
                                : "even:bg-gray-200 odd:bg-gray-100 "
                        }
                        key={index}
                    >
                        <td>
                            {customer.first_name} {customer.last_name}
                        </td>
                        <td>{customer.email}</td>
                        <td>{formatRole(customer.role)}</td>
                        <td>{formatDate(customer.created_at)}</td>
                        <td>
                            <button
                                className="p-1 min-w-0 bg-indigo-500 hover:bg-indigo-700 text-white text-xl rounded-md"
                                onClick={() =>
                                    handleRequest(customer.id, PRIVILEGED)
                                }
                            >
                                Approve
                            </button>
                        </td>
                        <td>
                            <button
                                className="p-1 min-w-0 bg-red-600 hover:bg-red-900 text-white text-xl rounded-md"
                                onClick={() =>
                                    handleRequest(customer.id, NON_PRIVILEGED)
                                }
                            >
                                Deny
                            </button>
                        </td>
                        <td>
                            <button
                                className="p-1 min-w-0 bg-red-600 hover:bg-red-900 text-white text-xl rounded-md"
                                onClick={() => deleteUser(customer.id)}
                            >
                                Delete User
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default CustomerAdminTable;
