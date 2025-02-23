import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import "./form.css";

const AccountCreationForm = () => {
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [accountExists, setAccountExists] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const userPassword = watch("password");
    const userConfirmPassword = watch("confirmPassword");

    useEffect(() => {
        if (userPassword !== userConfirmPassword) {
            setPasswordMatch(false);
        } else {
            setPasswordMatch(true);
        }
    }, [userPassword, userConfirmPassword]);

    const createAccount = async (accountDetails) => {
        try {
            console.log("accountDetails", accountDetails);
            
            if (accountDetails?.restricted === true) {
                accountDetails.restricted = -1;
            } else {
                accountDetails.restricted = 0;
            }
            console.log("Updated account", accountDetails);
            const response = await axios.post("/api/user", {
                accountDetails,
            });
            if (response.status === 200) {
                setError(null);
                navigate("/signIn");
            } else if (response.status === 409) {
                setAccountExists(true);
            }
        } catch (error) {
            console.error("There was an error submitting the form", error);
            setError(
                "There was an error submitting the form, please try again."
            );
        }
    };
    return (
        <div className="min-h-screen mt-10">
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
                        {accountExists && (
                            <p className="errorMsg">
                                An account with this email already exists!
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="password" className="mt-4">
                            Password:
                        </label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="password"
                            name="password"
                            id="password"
                            {...register("password", {
                                required: true,
                                minLength: 6,
                            })}
                        />
                        {errors.password?.type === "required" && (
                            <p className="errorMsg">Password is required</p>
                        )}
                        {errors.password?.type === "minLength" && (
                            <p className="errorMsg">
                                Password must be at least 6 characters
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="mt-4">
                            Confirm Password:
                        </label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            {...register("confirmPassword")}
                        />
                        {errors.password?.type === "required" && (
                            <p className="errorMsg">Password is required</p>
                        )}
                        {passwordMatch === false && (
                            <p className="errorMsg">
                                Passwords don't match {passwordMatch}
                            </p>
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
                            htmlFor="emailNotifications"
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
                        <button
                            type="submit"
                            className="w-full p-2 m-auto text-white bg-aurora-green py-2 px-4 mt-5 rounded"
                        >
                            Create Account
                        </button>
                        <p className="mt-6 text-xs font-light text-center text-gray-700">
                            Already have an account?{" "}
                            <Link
                                to="/signin"
                                className="font-medium hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountCreationForm;
