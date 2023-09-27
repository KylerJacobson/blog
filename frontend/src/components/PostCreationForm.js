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

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ values });

    useEffect(() => {
        const getPost = async () => {
            if (postId) {
                try {
                    const { data } = await axios.get(`/api/post/${postId}`);
                    setValues({
                        title: data.title,
                        content: data.content,
                        restricted: data.restricted,
                    });
                } catch (error) {
                    console.log(error);
                }
            }
        };
        getPost();
    }, [postId]);

    const createPost = async (postData) => {
        try {
            if (postId) {
                const response = await axios.put(`/api/post/${postId}`, {
                    postData,
                });
                if (response.status === 200) {
                    navigate("/");
                }
            } else {
                const response = await axios.post("/api/postCreation", {
                    postData,
                });
                if (response.status === 200) {
                    navigate("/");
                }
            }
        } catch (error) {
            console.error("There was an error submitting the form", error);
        }
    };
    return (
        <div className="p-2 m-auto bg-white rounded-md ring-2 shadow-md ring-slate-600 xl:max-w-6xl">
            <form
                onSubmit={handleSubmit((postData) => {
                    createPost(postData);
                })}
                className="max-w-screen-lg mx-auto p-4"
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

                <div className="mb-4">
                    <textarea
                        id="content"
                        name="content"
                        defaultValue={values.content}
                        rows="16"
                        className="mt-1 p-2 w-full rounded-md border"
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
        </div>
    );
};

export default PostCreationFrom;
