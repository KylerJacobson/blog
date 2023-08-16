import React, { useState } from "react";
import { Link } from "react-router-dom";

const AccountCreationForm = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("submitted");
    };

    return (
        <div className="min-h-screen mt-10">
            <div className="w-full p-6 m-auto bg-white rounded-md ring-2 shadow-md shadow-slate-600/80 ring-slate-600 lg:max-w-xl">
                <form onSubmit={handleSubmit}>
                    <div>
                        <label className="mt">Username:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="mt-4">Email:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="mt-4">Password:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="mt-4">Confirm Password:</label>
                        <input
                            className="w-full p-2 m-auto bg-white rounded-md ring-2 ring-slate-600"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
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
