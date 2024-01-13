import React from "react";
import "./About.css";

function About() {
    return (
        <div className="main">
            <h2>About</h2>
            <p>
                Hi, I'm Kyler. I'm a DevOps engineer with a passion for
                technology and software engineering. I graduated from Oregon
                State University in the spring of 2022 with a Bachelor's degree
                in Computer Science. I've been working as a DevOps engineer for
                2 years, but I'm now looking to transition to a full-stack
                software engineer. Offline, I enjoy reading, live music, deep
                conversations with friends, and hiking.
            </p>
            <p>
                I created this blog for a few reasons. First, I wanted a private
                place to stay connected with friends and family. Second, I
                wanted a venue to discuss technology, art, and ideas. Lastly, I
                wanted to sharpen my skills and tackle deploying a full-stack
                web application. To that end, this project is entirely {}
                <a
                    className="link"
                    href="https://github.com/KylerJacobson/blog"
                >
                    open-source
                </a>
                , and any feedback and/or feature requests are welcome and
                appreciated. Public writing is not what I would consider one of
                my strong suits, and being new to the field of software
                engineering, I'm sure I will get things wrong. So, here's to the
                beginning.
            </p>
            <p>Cheers</p>
        </div>
    );
}

export default About;
