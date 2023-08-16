import React from "react";
import AccountCreationForm from "../components/AccountCreationForm";

function CreateAccount() {
    return (
        <div className="main">
            <h1 className="text-4xl font-bold text-center mt-10">
                Create Account
            </h1>
            <AccountCreationForm />
        </div>
    );
}

export default CreateAccount;
