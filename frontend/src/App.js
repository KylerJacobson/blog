import "./App.css";
import Home from "./pages/Home";
import SharedLayout from "./pages/SharedLayout";
import CreateAccount from "./pages/CreateAccount";
import CreatePost from "./pages/CreatePost";
import AdminPanel from "./pages/AdminPanel";
import Post from "./pages/Post";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import SignIn from "./pages/SignIn";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import ErrorComponent from "./components/ErrorComponent";
import ManageAccount from "./pages/ManageAccount";

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
            <BrowserRouter>
                <RedirectToLogin>
                    <Routes>
                        <Route path="/" element={<SharedLayout />}>
                            <Route index element={<Home />} />
                        </Route>
                        <Route path="/about" element={<SharedLayout />}>
                            <Route index element={<h1>About</h1>} />
                        </Route>
                        <Route path="/createAccount" element={<SharedLayout />}>
                            <Route index element={<CreateAccount />} />
                        </Route>
                        <Route path="/manageAccount" element={<SharedLayout />}>
                            <Route index element={<ManageAccount />} />
                        </Route>
                        <Route path="/signIn" element={<SharedLayout />}>
                            <Route index element={<SignIn />} />
                        </Route>
                        <Route path="/createPost" element={<SharedLayout />}>
                            <Route index element={<CreatePost />} />
                        </Route>
                        <Route path="/adminPanel" element={<SharedLayout />}>
                            <Route index element={<AdminPanel />} />
                        </Route>
                        <Route
                            path="/editPost/:postId"
                            element={<SharedLayout />}
                        >
                            <Route index element={<CreatePost />} />
                        </Route>
                        <Route path="/post/:postId" element={<SharedLayout />}>
                            <Route index element={<Post />} />
                        </Route>
                        <Route
                            path="/error/:errorId"
                            element={<SharedLayout />}
                        >
                            <Route index element={<ErrorComponent />} />
                        </Route>
                        <Route path="*" element={<h1>404 Not Found</h1>} />
                    </Routes>
                </RedirectToLogin>
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

export default App;

function RedirectToLogin(props) {
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    useEffect(() => {
        const verifySession = async () => {
            try {
                const { data: user } = await axios.get(`/api/user`, {
                    withCredentials: true,
                });
                setCurrentUser(user);
            } catch (error) {
                if (
                    error.response &&
                    error.response.data.message ===
                        "Unauthorized: Token expired"
                ) {
                    navigate("/signIn");
                }
                console.error("Session verification failed: ", error);
            }
        };
        verifySession();
    }, []);
    return props.children;
}
