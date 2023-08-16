import "./App.css";
import Home from "./pages/Home";
import SharedLayout from "./pages/SharedLayout";
import CreateAccount from "./pages/CreateAccount";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";

function App() {
    return (
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
                <Route path="/signin" element={<SharedLayout />}>
                    <Route index element={<SignIn />} />
                </Route>
                <Route path="*" element={<h1>404 Not Found</h1>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
