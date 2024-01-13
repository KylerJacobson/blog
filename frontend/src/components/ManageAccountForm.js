import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useForm } from "react-hook-form";
import axios from "axios";
import "./form.css";

const ManageAccountForm = () => {
    const [error, setError] = useState(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const { currentUser, setCurrentUser } = useContext(AuthContext);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        const getUser = async () => {
            if (currentUser?.id) {
                try {
                    let restricted;
                    if (currentUser.role !== 0) {
                        restricted = true;
                    } else {
                        restricted = false;
                    }
                    setValue("firstName", currentUser.firstName);
                    setValue("lastName", currentUser.lastName);
                    setValue("email", currentUser.email);
                    setValue("restricted", restricted);
                    setValue(
                        "emailNotification",
                        currentUser.emailNotification
                    );
                } catch (error) {
                    console.error(error);
                }
            }
        };
        getUser();
    }, [currentUser]);

    const createAccount = async (accountDetails) => {
        try {
            let role;
            if (accountDetails.restricted === false) {
                role = 0;
            } else if (accountDetails.restricted && currentUser.role === 0) {
                role = -1;
            } else {
                role = currentUser.role;
            }
            const updatedUser = await axios.put("/api/user", {
                user: {
                    id: currentUser.id,
                    first_name: accountDetails.firstName,
                    last_name: accountDetails.lastName,
                    email: accountDetails.email,
                    role: role,
                    email_notification: accountDetails.emailNotification,
                },
                role: currentUser.role,
            });
            if (updatedUser.status === 200) {
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 1500);
                setError(null);
                setCurrentUser(updatedUser.data);
            }
        } catch (error) {
            console.error("There was an error submitting the form", error);
            setError(
                "There was an error submitting the form, please try again."
            );
        }
    };
    return (
        <div className="h-[80vh] mt-10">
            <div className="w-full p-6 m-auto bg-white rounded-md ring-2 shadow-md shadow-slate-600/80 ring-slate-600 lg:max-w-xl">
                <form
                    onSubmit={handleSubmit((formData) => {
                        createAccount(formData);
                    })}
                >
                    <div>
                        <label htmlFor="firstName" className="mt">
                            First Name:
                        </label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="text"
                            name="firstName"
                            id="firstName"
                            {...register("firstName", {
                                required: true,
                                maxLength: 20,
                                message: "This is required",
                            })}
                        />
                        {errors.firstName?.type === "maxLength" && (
                            <p className="errorMsg">
                                First name exceeds max length
                            </p>
                        )}
                        {errors.firstName?.type === "required" && (
                            <p className="errorMsg">First name is required</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="lastName" className="mt-4">
                            Last Name:
                        </label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="text"
                            name="lastName"
                            id="lastName"
                            {...register("lastName", {
                                required: true,
                                maxLength: 20,
                            })}
                        />
                        {errors.lastName?.type === "maxLength" && (
                            <p className="errorMsg">
                                Last name exceeds max length
                            </p>
                        )}
                        {errors.lastName?.type === "required" && (
                            <p className="errorMsg">Last name is required</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="email" className="mt-4">
                            Email:
                        </label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="email"
                            name="email"
                            id="email"
                            {...register("email", { required: true })}
                        />
                        {errors.email?.type === "required" && (
                            <p className="errorMsg">Email is required.</p>
                        )}
                    </div>
                    <div className="mt-4 ">
                        <input
                            type="checkbox"
                            id="restricted"
                            name="restricted"
                            className="mr-2"
                            {...register("restricted")}
                        />
                        <label
                            htmlFor="restricted"
                            className="text-lg font-medium text-gray-600"
                        >
                            Request access to private posts
                        </label>
                    </div>
                    <div className="mt-4 ">
                        <input
                            type="checkbox"
                            id="emailNotification"
                            name="emailNotification"
                            className="mr-2"
                            {...register("emailNotification")}
                        />
                        <label
                            htmlFor="emailNotification"
                            className="text-lg font-medium text-gray-600"
                        >
                            Email notifications for new posts
                        </label>
                    </div>
                    <div>
                        {error && (
                            <p className="errorMsg" role="alert">
                                {error}
                            </p>
                        )}
                        <div className="mt-5 mb-3" style={{ height: "20px" }}>
                            {showSuccessMessage && (
                                <div style={{ color: "green" }}>
                                    Account successfully updated
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full p-2 m-auto bg-indigo-500 hover:bg-indigo-700 text-white py-2 px-4  rounded"
                        >
                            Update Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManageAccountForm;
