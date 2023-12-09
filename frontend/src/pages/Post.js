import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import formatDate from "../helpers/helpers";
import "./Post.css";
import ErrorComponent from "../components/ErrorComponent";
import { useNavigate } from "react-router-dom";
import { ADMIN } from "../constants/roleConstants";

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
                const response = await axios.get(`/api/post/${postId}`, {
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
        const response = await axios.post("/api/deletePostById", {
            postId,
        });
        if (response.status === 200) {
        } else {
            console.error("error deleting post, please try again");
        }
    };

    const fetchMedia = async (post) => {
        let response;
        if (post.restricted) {
            response = await axios.get(`/api/getPrivateMedia/${post.post_id}`);
        } else {
            response = await axios.get(`/api/getPublicMedia/${post.post_id}`);
        }
        const sasMedia = [];
        for (const media of response.data) {
            const sasResponse = await axios.post("/api/mediaSAS", {
                blobName: media.blob_name,
            });
            sasMedia.push({
                url: sasResponse.data.blobSasUrl,
                contentType: media.content_type,
            });
        }
        setMedia(sasMedia);
    };
    return (
        <div className=" flex flex-col p-2 my-8 mx-auto bg-white shadow-lg xl:max-w-6xl px-5">
            <div>
                <h1 className="mt-4">{post.title}</h1>
                <p>
                    {post.created_at && formatDate(post.created_at)}{" "}
                    {post ? "by Kyler Jacobson" : ""}
                </p>
                <div>
                    {currentUser?.role === ADMIN && (
                        <button
                            className="p-1 min-w-0 bg-indigo-500 hover:bg-indigo-700 text-white text-xl rounded-md"
                            onClick={editPost}
                        >
                            Edit Post
                        </button>
                    )}{" "}
                    {currentUser?.role === ADMIN && (
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
                              {item.contentType === "image/jpeg" && (
                                  <img src={item.url} alt="images for post" />
                              )}
                              {item.contentType === "video/mp4" && (
                                  <video controls>
                                      <source
                                          src={item.url}
                                          type={item.contentType}
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
