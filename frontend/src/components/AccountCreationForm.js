import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import "./form.css";

const AccountCreationForm = () => {
    const [passwordMatch, setPasswordMatch] = useState(true);

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
            console.log("Passwords don't match");
            setPasswordMatch(false);
        } else {
            setPasswordMatch(true);
        }
    }, [userPassword, userConfirmPassword]);

    const createAccount = async (data) => {
        try {
            const response = await fetch("/api/accountCreation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await response;
            console.log(result);
        } catch (error) {
            console.error("There was an error submitting the form", error);
        }
    };
    return (
        <div className="min-h-screen mt-10">
            <div className="w-full p-6 m-auto bg-white rounded-md ring-2 shadow-md shadow-slate-600/80 ring-slate-600 lg:max-w-xl">
                <form
                    onSubmit={handleSubmit((data) => {
                        createAccount(data);
                    })}
                >
                    <div>
                        <label className="mt">First Name:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="text"
                            name="firstName"
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
                        <label className="mt-4">Last Name:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="text"
                            name="lastName"
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
                        <label className="mt-4">Email:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="email"
                            name="email"
                            {...register("email", { required: true })}
                        />
                        {errors.email?.type === "required" && (
                            <p className="errorMsg">Email is required.</p>
                        )}
                        {errors.email && (
                            <p className="errorMsg">{errors.email.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="mt-4">Password:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="password"
                            name="password"
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
                        <label className="mt-4">Confirm Password:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="password"
                            name="confirmPassword"
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
                    <div>
                        <button
                            type="submit"
                            className="w-full p-2 m-auto bg-indigo-500 hover:bg-indigo-700 text-white py-2 px-4 mt-5 rounded"
                        >
                            Create Account
                        </button>
                        <p className="mt-6 text-xs font-light text-center text-gray-700">
                            Already have an account?{" "}
                            <Link
                                to="/signin"
                                className="font-medium text-indigo-600 hover:underline"
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
