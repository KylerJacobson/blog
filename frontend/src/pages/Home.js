import React, { useEffect, useState, useContext } from "react";
import "./Home.css";
import axios from "axios";
import PostCard from "../components/PostCard";
import { AuthContext } from "../contexts/AuthContext";

function Home() {
    const [posts, setPosts] = useState("");
    const [refreshPosts, setRefreshPosts] = useState(false);
    const { currentUser } = useContext(AuthContext);

    useEffect(() => {
        const getPosts = async () => {
            try {
                const response = await axios.get("/api/posts", {
                    withCredentials: true,
                });
                setPosts(response.data);
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
