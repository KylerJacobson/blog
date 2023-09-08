import "./App.css";
import Home from "./pages/Home";
import SharedLayout from "./pages/SharedLayout";
import CreateAccount from "./pages/CreateAccount";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import SignIn from "./pages/SignIn";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const { data: user } = await axios.get("/api/getUser/", {
                    withCredentials: true,
                });
                setCurrentUser(user);
            } catch (error) {
                if (
                    error.response &&
                    error.response.data.message ===
                        "Unauthorized: Token expired"
                ) {
                    console.log("Need to navigate to /signIn");
                }
                console.error("Session verification failed: ", error);
            }
        };
        verifySession();
    }, []);
    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
            <BrowserRouter>
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
                    <Route path="/signIn" element={<SharedLayout />}>
                        <Route index element={<SignIn />} />
                    </Route>
                    <Route path="*" element={<h1>404 Not Found</h1>} />
                </Routes>
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

export default App;
