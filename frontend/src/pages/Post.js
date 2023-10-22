import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import formatDate from "../helpers/helpers";
import "./Post.css";
import ErrorComponent from "../components/ErrorComponent";

function Post() {
    const [post, setPost] = useState("");
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const currentUser = useContext(AuthContext);
    const { postId } = useParams();
    useEffect(() => {
        const getPost = async () => {
            try {
                const response = await axios.get(`/api/post/${postId}`, {
                    withCredentials: true,
                });
                setPost(response.data);
                if (response.status !== 200) {
                    setHasError(true);
                }
            } catch (error) {
                setHasError(true);
                const message = error?.response?.data || {};
                setErrorMessage(message || "An unknown error occurred");
            }
        };
        getPost();
    }, [currentUser]);

    return (
        <div>
            <div>
                <h1 className="mt-4">{post.title}</h1>
                <p>
                    {post.created_at && formatDate(post.created_at)}{" "}
                    {post ? "by Kyler Jacobson" : ""}
                </p>
            </div>
            <div className="post-content mt-8">
                <p>{post.content}</p>
            </div>
            {hasError && <ErrorComponent message={errorMessage} />}
        </div>
    );
}

export default Post;
