import React, { useEffect, useState, useContext } from "react";
import "./Home.css";
import axios from "axios";
import PostCard from "../components/PostCard";
import { AuthContext } from "../contexts/AuthContext";
import { ADMIN, PRIVILEGED } from "../constants/roleConstants";
function Home() {
    const [posts, setPosts] = useState("");
    const [refreshPosts, setRefreshPosts] = useState(false);
    const currentUser = useContext(AuthContext);

    useEffect(() => {
        const getPosts = async () => {
            try {
                if (
                    currentUser &&
                    (currentUser?.currentUser?.role === PRIVILEGED ||
                        currentUser?.currentUser?.role === ADMIN)
                ) {
                    const response = await axios.get("/api/getAllRecentPosts", {
                        withCredentials: true,
                    });
                    setPosts(response.data);
                } else {
                    const response = await axios.get(
                        "/api/getPublicRecentPosts"
                    );
                    setPosts(response.data);
                }
            } catch (error) {
                console.error("There was an error submitting the form", error);
            }
        };
        getPosts();
    }, [currentUser, refreshPosts]);

    const handlePostDelete = () => {
        setRefreshPosts((prev) => !prev); // Toggle the state to refresh posts
    };

    return (
        <div className="home">
            {posts.length > 0 ? (
                posts.map((post, index) => (
                    <PostCard
                        key={index}
                        title={post.title}
                        content={post.content}
                        restricted={post.restricted}
                        postDate={post.created_at}
                        postId={post.post_id}
                        onDelete={handlePostDelete}
                    />
                ))
            ) : (
                <p>Loading posts...</p>
            )}
        </div>
    );
}

export default Home;
