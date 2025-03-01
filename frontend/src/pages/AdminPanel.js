import React from "react";
import UserAdminTable from "../components/UserAdminTable";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

function AdminPanel() {
    return (
        <div className="mt-10">
            <UserAdminTable />
            <AnalyticsDashboard />
        </div>
    );
}

export default AdminPanel;
