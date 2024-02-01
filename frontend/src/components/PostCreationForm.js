import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import Markdown from "react-markdown";

const PostCreationFrom = () => {
    const { postId } = useParams();
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState();
    const [values, setValues] = useState({
        title: "",
        content: "",
        restricted: true,
    });
    const [media, setMedia] = useState([]);
    const [showOverlay, setShowOverlay] = useState(false);
    const fileInputRef = useRef(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({ values });
    useEffect(() => {
        if (!currentUser || currentUser.role !== 1) {
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

    function useHotkey(key, action) {
        useEffect(() => {
            function onKeydown(e) {
                if (e.key === key) setShowOverlay(!showOverlay);
            }

            window.addEventListener("keydown", onKeydown);

            return () => window.removeEventListener("keydown", onKeydown);
        }, [key, action]);
    }
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
                handleUpload(response.data, postData.restricted);
                if (response.status === 200) {
                    navigate("/");
                }
            }
        } catch (error) {
            console.error("There was an error submitting the form", error);
        }
    };
    const [files, setFiles] = useState([]);
    const handleFileChange = (event) => {
        if (
            event.target.files[0] &&
            event.target.files[0].type.startsWith("video/") &&
            event.target.files[0].type !== "video/mp4"
        ) {
            setError("Please use MP4 video type");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } else {
            setError("");
            setFiles([...files, event.target.files[0]]);
        }
    };
    const handleUpload = async (postId, restricted) => {
        if (files) {
            const formData = new FormData();
            formData.append("restricted", restricted);
            for (const file of files) {
                formData.append("photos", file);
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
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "restricted") {
            setValues((prevValues) => ({
                ...prevValues,
                [name]: e.target.checked,
            }));
        } else {
            setValues((prevValues) => ({
                ...prevValues,
                [name]: value,
            }));
        }
    };
    const onSubmit = (data) => {
        createPost(data);
    };
    useHotkey("F2", showOverlay);
    return (
        <div>
            <div>
                {showOverlay && (
                    <div className="h-[80vh] flex flex-col p-2 m-auto bg-white shadow-lg xl:max-w-6xl">
                        <div className="post-content overflow-auto">
                            <Markdown>{values.content}</Markdown>
                        </div>
                    </div>
                )}
            </div>

            {!showOverlay && (
                <div className="h-[80vh] flex flex-col p-2 m-auto bg-white shadow-lg xl:max-w-6xl">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col h-[90vh] p-4"
                    >
                        <div className="mb-4">
                            <label
                                htmlFor="title"
                                className="block text-2xl font-medium text-gray-600"
                            >
                                Title
                            </label>
                            <Controller
                                name="title"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <input
                                        type="text"
                                        defaultValue={values.title}
                                        onChange={handleInputChange}
                                        id="title"
                                        name="title"
                                        className="mt-1 p-2 w-full rounded-md border"
                                    />
                                )}
                            />
                        </div>

                        <div className="mb-4 flex flex-col flex-grow p-4">
                            <Controller
                                name="content"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <textarea
                                        defaultValue={values.content}
                                        onChange={handleInputChange}
                                        id="content"
                                        name="content"
                                        className="flex flex-col flex-grow p-4 mt-1 p-2 w-full rounded-md border"
                                    ></textarea>
                                )}
                            />
                        </div>

                        <div className="mb-4">
                            <Controller
                                name="restricted"
                                control={control}
                                defaultValue={values.restricted}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        id="restricted"
                                        name="restricted"
                                        checked={field.value}
                                        onChange={(e) =>
                                            field.onChange(e.target.checked)
                                        }
                                        className="mr-2"
                                    />
                                )}
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
                            className="w-full p-2 min-w-0 bg-aurora-green text-white text-xl rounded-md mx-auto block"
                        >
                            Submit
                        </button>
                    </form>
                    <div>
                        {error && <p style={{ color: "Red" }}>{error}</p>}
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
                        <input
                            type="file"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                        />
                    </div>

                    <div>
                        <ul>
                            {files.map((file) => {
                                return <li>{file?.name}</li>;
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCreationFrom;
