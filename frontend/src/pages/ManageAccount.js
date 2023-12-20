import React, { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import ManageAccountForm from "../components/ManageAccountForm";

function ManageAccount() {
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    return (
        <div className="main">
            <h1 className="text-4xl font-bold text-center mt-10">
                Manage Account
            </h1>
            <ManageAccountForm />
        </div>
    );
}

export default ManageAccount;
