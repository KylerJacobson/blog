import React from "react";
import { useParams } from "react-router-dom";

function ErrorComponent(props) {
    const { errorId } = useParams();
    return (
        <div>
            <h1>Oops! Something went wrong...</h1>
            <p>
                {errorId === "401" &&
                    "401 - You are not authorized to complete this action"}
            </p>
        </div>
    );
}

export default ErrorComponent;
