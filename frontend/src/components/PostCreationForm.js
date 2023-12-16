import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

const PostCreationFrom = () => {
    const { postId } = useParams();
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [values, setValues] = useState({
        title: "",
        content: "",
        restricted: "",
    });
    const [media, setMedia] = useState([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ values });

    useEffect(() => {
        if (!currentUser || currentUser.role !== 1) {
            console.log("You are not authorized to view this page");
            navigate("/error/403");
        }
        const getPost = async () => {
            if (postId) {
                try {
                    const { data } = await axios.get(`/api/posts/${postId}`);
                    setValues({
                        title: data.title,
                        content: data.content,
                        restricted: data.restricted,
                    });
                    const response = await axios.get(`/api/media/${postId}`, {
                        withCredentials: true,
                    });
                    if (response.status === 200) {
                        setMedia(response.data);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        };
        getPost();
    }, [postId]);

    const createPost = async (postData) => {
        try {
            if (postId) {
                const response = await axios.put(`/api/posts/${postId}`, {
                    postData,
                });
                if (response.status === 200) {
                    navigate("/");
                }
            } else {
                const response = await axios.post("/api/posts", {
                    postData,
                });
                if (response.status === 200) {
                    navigate("/");
                }
                handleUpload(response.data, postData.restricted);
            }
        } catch (error) {
            console.error("There was an error submitting the form", error);
        }
    };
    const [files, setFiles] = useState([]);
    const handleFileChange = (event) => {
        setFiles([...files, event.target.files[0]]);
    };
    const handleUpload = async (postId, restricted) => {
        if (files) {
            const formData = new FormData();
            for (const file of files) {
                formData.append("photos", file);
                formData.append("restricted", restricted);
            }
            formData.append("postId", postId);
            try {
                const response = await axios.post("/api/media", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            } catch (error) {
                alert("Error uploading file");
            }
        } else {
            alert("Please select a file first");
        }
    };

    const removeFile = async (mediaId) => {
        try {
            const response = await axios.delete(`/api/media/${mediaId}`, {
                withCredentials: true,
            });
            if (response.status === 200) {
                setMedia((media) =>
                    media.filter((content) => content.id !== mediaId)
                );
            }
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <div className="h-[80vh] flex flex-col p-2 m-auto bg-white shadow-lg xl:max-w-6xl">
            <form
                onSubmit={handleSubmit((postData) => {
                    createPost(postData);
                })}
                className="flex flex-col h-[90vh] p-4"
            >
                <div className="mb-4">
                    <label
                        htmlFor="title"
                        className="block text-2xl font-medium text-gray-600"
                    >
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        defaultValue={values.title}
                        className="mt-1 p-2 w-full rounded-md border"
                        {...register("title", {
                            required: true,
                        })}
                    />
                </div>

                <div className="mb-4 flex flex-col flex-grow p-4">
                    <textarea
                        id="content"
                        name="content"
                        defaultValue={values.content}
                        className="flex flex-col flex-grow p-4 mt-1 p-2 w-full rounded-md border"
                        {...register("content", {
                            required: true,
                        })}
                    ></textarea>
                </div>

                <div className="mb-4">
                    <input
                        type="checkbox"
                        id="restricted"
                        name="restricted"
                        className="mr-2"
                        {...register("restricted")}
                    />
                    <label
                        htmlFor="private"
                        className="text-lg font-medium text-gray-600"
                    >
                        Make Private
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full p-2 min-w-0 bg-indigo-500 hover:bg-indigo-700 text-white text-xl rounded-md mx-auto block"
                >
                    Submit
                </button>
            </form>
            <div>
                <p>Uploaded Files</p>
                <ul>
                    {media.map((file) => {
                        return (
                            <li>
                                {file.blob_name}{" "}
                                <button
                                    onClick={() => removeFile(file.id)}
                                    style={{ color: "red" }}
                                >
                                    X
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div>
                <input type="file" onChange={handleFileChange} />
            </div>

            <div>
                <ul>
                    {files.map((file) => {
                        return <li>{file.name}</li>;
                    })}
                </ul>
            </div>
        </div>
    );
};

export default PostCreationFrom;
