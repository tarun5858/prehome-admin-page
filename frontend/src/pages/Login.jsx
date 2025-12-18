import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const BASE_URL = isLocal
      ? "http://localhost:5000"
      : import.meta.env.VITE_API_BASE_URL;

    try {
      // const res = await fetch(
      //   `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
      //   // `http://localhost:5000/api/login`,
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ username, password }),
      //   }
      // );

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      console.log("API Response:", data);

      // if (res.ok && data.token) {
      //   login(data.token); // store token in context/localStorage
      //   navigate("/admin-home");
      // } 
      if (res.ok && data.token) {
    // 1. Force save to localStorage immediately to avoid race conditions
    localStorage.setItem("token", data.token); 
    
    // 2. Update your AuthContext
    login(data.token); 
    
    // 3. Navigate to Hub
    navigate("/admin-home");
}else {
        alert(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Unable to login. Please try again.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
        height: "500px",
        fontFamily: "poppins",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h2 style={{ fontWeight: "700" }}>Admin Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            border: "1px solid black",
            padding: "3%",
            borderRadius: "8px",
            margin: "1%",
          }}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            border: "1px solid black",
            padding: "3%",
            borderRadius: "8px",
            margin: "1%",
          }}
        />
        <br />
        <button
          type="submit"
          style={{
            border: "1px solid black",
            padding: "5%",
            borderRadius: "8px",
            margin: "1%",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        <br />
        <Link to="/change-password" style={{ fontSize: "14px" }}>
          Forgot / Change Password?
        </Link>
      </form>
    </div>
  );
}

export default Login;
