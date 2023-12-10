import React from "react";
import axios from "axios";
import UserAdminTable from "../components/UserAdminTable";

function AdminPanel() {
    return (
        <div>
            <h1>Admin Panel</h1>
            <UserAdminTable />
        </div>
    );
}

export default AdminPanel;
