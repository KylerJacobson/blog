import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Markdown from "react-markdown";
import { AuthContext } from "../contexts/AuthContext";
import { ROLE } from "../constants/roleConstants";
import convertUtcToLocal from "../helpers/helpers";
import "./PostCard.css";

const PostCard = (props) => {
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const deletePost = async (event) => {
        event.stopPropagation();
        const id = props.postId;
        const response = await axios.delete(`/api/posts/${id}`);
        if (response.status === 200) {
            props.onDelete();
        } else {
            console.error("error deleting post, please try again");
        }
    };

    const editPost = async (event) => {
        event.stopPropagation();
        const postId = props.postId;
        navigate(`/editPost/${postId}`);
    };
    const viewPost = async () => {
        const postId = props.postId;
        navigate(`/post/${postId}`);
    };

    return (
        <div
            className="bg-white shadow-lg my-6 rounded-md p-4 h-80 overflow-hidden cursor-pointer relative"
            onClick={viewPost}
        >
            <h2
                className="post-title text-2xl font-semibold cursor-pointer"
                onClick={viewPost}
            >
                {props.title}
            </h2>
            <div className="flex items-center relative text-md text-gray-600 mb-3">
                <span className="mr-1">
                    {convertUtcToLocal(props.postDate)}
                </span>
                {props.restricted && (
                    <div className="mt-0">
                        <svg
                            className="fill-current text-gray-500 w-3 h-3 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                        >
                            <path d="M4 8V6a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2h1zm5 6.73V17h2v-2.27a2 2 0 1 0-2 0zM7 6v2h6V6a3 3 0 0 0-6 0z" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="truncate overflow-ellipsis h-[220px]">
                <div className="post-card-content ">
                    <p className=" text-gray-600">
                        <Markdown>{props.content}</Markdown>
                    </p>
                </div>
            </div>

            <div className="timestamp absolute top-0 right-0 mt-4 mr-4">
                {currentUser?.role === ROLE.ADMIN && (
                    <button
                        className="p-1 min-w-0 bg-aurora-green text-white text-xl rounded-md"
                        onClick={(event) => editPost(event)}
                    >
                        Edit Post
                    </button>
                )}{" "}
                {currentUser?.role === ROLE.ADMIN && (
                    <button
                        className="p-1 min-w-0 bg-aurora-red text-white text-xl rounded-md"
                        onClick={(event) => deletePost(event)}
                    >
                        Delete Post
                    </button>
                )}
            </div>
        </div>
    );
};

export default PostCard;
