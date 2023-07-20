import React from "react";
import "./Footer.css";

function Footer() {
    let date = new Date().getFullYear();
    return (
        <div className="footer">
            <div className="footer-box">
                <p>© {date}</p>
            </div>
        </div>
    );
}

export default Footer;
