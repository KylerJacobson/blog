import React from "react";
import axios from "axios";
import CustomerAdminTable from "../components/CustomerAdminTable";

function AdminPanel() {
    return (
        <div>
            <h1>Admin Panel</h1>
            <CustomerAdminTable />
        </div>
    );
}

export default AdminPanel;
