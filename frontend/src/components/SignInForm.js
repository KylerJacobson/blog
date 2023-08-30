import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./form.css";

const SignInForm = () => {
    const [validLogin, setValidLogin] = useState();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const signIn = async (data) => {
        try {
            const response = await fetch("/api/signIn", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!result.token) {
                setValidLogin(false);
            } else {
                setValidLogin(true);
                localStorage.setItem("jwtToken", result.token);
                navigate("/");
            }
        } catch (error) {
            console.error("There was an error submitting the form", error);
        }
    };

    return (
        <div className="min-h-screen mt-10">
            <div className="w-full p-6 m-auto bg-white rounded-md ring-2 shadow-md shadow-slate-600/80 ring-slate-600 lg:max-w-xl">
                <form
                    onSubmit={handleSubmit((data) => {
                        signIn(data);
                    })}
                >
                    <div>
                        <label className="mt">Email:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="email"
                            name="email"
                            {...register("email", { required: true })}
                        />
                        {errors.email?.type === "required" && (
                            <p className="errorMsg">Email is required</p>
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
                            })}
                        />
                        {errors.password?.type === "required" && (
                            <p className="errorMsg">Password is required</p>
                        )}
                    </div>
                    <div>
                        {validLogin === false && (
                            <p className="errorMsg">
                                Invalid email or password
                            </p>
                        )}
                        <button
                            type="submit"
                            className="w-full p-2 m-auto bg-indigo-500 hover:bg-indigo-700 text-white py-2 px-4 mt-5 rounded"
                        >
                            Log In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignInForm;
