import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import formatDate from "../helpers/helpers";

function Post() {
    const [post, setPost] = useState("");
    const currentUser = useContext(AuthContext);
    const { postId } = useParams();
    useEffect(() => {
        const getPost = async () => {
            try {
                const response = await axios.get(`/api/post/${postId}`, {
                    withCredentials: true,
                });
                setPost(response.data);
            } catch (error) {
                console.error(
                    "There was an error submitting the getting the post",
                    error
                );
            }
        };
        getPost();
    }, [currentUser]);

    return (
        <div>
            <h1>{post.title}</h1>
            <p>{formatDate(post.created_at)}</p>
            <p>{post.content}</p>
        </div>
    );
}

export default Post;
