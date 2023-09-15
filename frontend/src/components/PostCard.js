import React from "react";
import axios from "axios";

const PostCard = (props) => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const utcDate = new Date(props.postDate);

    const postTime = utcDate.toLocaleString(undefined, {
        timeZone: userTimeZone,
    });

    const deletePost = async () => {
        let postId = props.postId;
        const response = await axios.post("/api/deletePostById", {
            postId,
        });
        if (response.status === 200) {
        } else {
            console.log("error deleting post, please try again");
        }
    };
    return (
        <div className="bg-white shadow-md my-6	 rounded-md p-4 ring-2 shadow-md ring-slate-600">
            <h2 className="text-2xl font-semibold">{props.title}</h2>
            <p className="text-gray-600">{props.content}</p>
            <p className="text-gray-500 mt-2">Author: Kyler Jacobson</p>
            {props.restricted && (
                <p class="text-sm text-gray-600 flex items-center">
                    <svg
                        class="fill-current text-gray-500 w-3 h-3 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                    >
                        <path d="M4 8V6a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2h1zm5 6.73V17h2v-2.27a2 2 0 1 0-2 0zM7 6v2h6V6a3 3 0 0 0-6 0z" />
                    </svg>
                    Private
                </p>
            )}
            <p>Posted at: {postTime}</p>
            <button onClick={deletePost}>Delete Post</button>
        </div>
    );
};

export default PostCard;
