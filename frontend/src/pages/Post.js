import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import convertUtcToLocal from "../helpers/helpers";
import "./Post.css";
import { useNavigate } from "react-router-dom";
import { ROLE } from "../constants/roleConstants";

function Post() {
    const [post, setPost] = useState("");
    const [media, setMedia] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const { currentUser } = useContext(AuthContext);
    const { postId } = useParams();

    useEffect(() => {
        const getPost = async () => {
            try {
                const response = await axios.get(`/api/posts/${postId}`, {
                    withCredentials: true,
                });
                setPost(response.data);
                if (response.status !== 200) {
                    setHasError(true);
                }
                if (media.length === 0) {
                    fetchMedia(response.data);
                }
            } catch (error) {
                setHasError(true);
                const message = error?.response?.data || {};
                setErrorMessage(message || "An unknown error occurred");
                navigate("/error/" + error?.response?.status);
            }
        };
        getPost();
    }, [currentUser]);

    const editPost = async () => {
        navigate(`/editPost/${postId}`);
    };

    const deletePost = async () => {
        const response = await axios.delete(`/api/posts/${postId}`);
        if (response.status === 200) {
            navigate("/");
        } else {
            console.error("error deleting post, please try again");
        }
    };

    const fetchMedia = async (post) => {
        let response;
        response = await axios.get(`/api/media/${post.post_id}`, {
            withCredentials: true,
        });

        setMedia(response.data);
    };
    return (
        <div className=" flex flex-col p-2 my-8 mx-auto bg-white shadow-lg xl:max-w-6xl px-5">
            <div>
                <h1 className="mt-4">{post.title}</h1>
                <p>
                    {post.created_at && convertUtcToLocal(post.created_at)}{" "}
                    {post ? "by Kyler Jacobson" : ""}
                </p>
                <div>
                    {currentUser?.role === ROLE.ADMIN && (
                        <button
                            className="p-1 min-w-0 bg-indigo-500 hover:bg-indigo-700 text-white text-xl rounded-md"
                            onClick={editPost}
                        >
                            Edit Post
                        </button>
                    )}{" "}
                    {currentUser?.role === ROLE.ADMIN && (
                        <button
                            className="p-1 min-w-0 bg-indigo-500 hover:bg-indigo-700 text-white text-xl rounded-md"
                            onClick={deletePost}
                        >
                            Delete Post
                        </button>
                    )}
                </div>
            </div>
            <div className="post-content mt-8">
                <p>{post.content}</p>
                {media.length > 0
                    ? media.map((item, index) => (
                          <div key={index}>
                              {item.content_type.startsWith("image/") && (
                                  <img src={item.url} alt="images for post" />
                              )}
                              {item.content_type === "video/mp4" && (
                                  <video controls>
                                      <source
                                          src={item.url}
                                          type={item.content_type}
                                      ></source>
                                      Your browser does not support the video
                                      tag
                                  </video>
                              )}
                              <br />
                          </div>
                      ))
                    : " "}
            </div>
        </div>
    );
}

export default Post;
