import React from "react";

function ErrorComponent(props) {
    return (
        <div>
            <h1>Oops! Something went wrong...</h1>
            <p>{props.message}</p>
        </div>
    );
}

export default ErrorComponent;
