import React from "react";
import "./Footer.css";

function Footer() {
    let date = new Date().getFullYear();
    return (
        <div className="footer">
            <div className="footer-box">
                <p>v.1.1.0</p>
            </div>
        </div>
    );
}

export default Footer;
