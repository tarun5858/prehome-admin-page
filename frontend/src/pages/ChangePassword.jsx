// ChangePassword.jsx
import { useState } from "react";
import {  Link } from "react-router-dom";
export default function ChangePassword() {
  const [email, setEmail] = useState("tarun.ccl19@gmail.com"); // prefill
  const [step, setStep] = useState(1); // 1=request,2=verify,3=reset
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [msg, setMsg] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // async function sendOtp() {
  //   setMsg("");
  //   try {
  //   //   const res = await fetch("https://dynamic-website-backend.onrender.com/auth/request-reset", {
  //     // const res = await fetch("https://dynamic-blog-server-g5ea.onrender.com/api/auth/request-reset", {
  //     // const res = await fetch("http://localhost:5000/api/auth/request-reset", {
  //     const res = await fetch(`${API_BASE}/api/auth/request-reset`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email })
  //     });
  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.message || "Failed");
  //     setMsg(data.message || "OTP sent");
  //     setStep(2);
  //   } catch (err) {
  //     setMsg(err.message);
  //   }
  // }
  async function sendOtp() {
  setMsg("");
  try {
    const res = await fetch(`${API_BASE}/api/auth/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to send OTP");

    // Show alert with OTP in dev mode
    if (data.devOtp) {
      alert(`Your OTP (for local testing): ${data.devOtp}`);
    }

    setMsg(data.message || "OTP sent successfully!");
    setResetToken(data.resetToken); // ✅ store token
    setStep(2); // show verify OTP UI now
  } catch (err) {
    console.error(err);
    setMsg(err.message || "Something went wrong");
  }
}

  async function verifyOtp() {
    setMsg("");
    try {
      // const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
       alert("OTP Verified");
    console.log("Received token:", data.resetToken); // 👀 Check here
    setResetToken(data.resetToken);
      setMsg("OTP verified");
      setStep(3);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function resetPassword() {
  setMsg("");
  try {

    if (!resetToken || !newPassword) {
      alert("Missing token or password");
      console.log("resetToken:", resetToken, "newPassword:", newPassword);
      return;
    }


    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         resetToken,
         newPassword,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert("Password updated successfully!");
    setMsg("Password updated successfully. You can now log in with your new password.");
    setStep(1); // Go back to first step or login
  } catch (err) {
    console.error(err);
    setMsg(err.message || "Password reset failed");
  }
}

  return (
    <div style={{maxWidth:600, margin:"auto"}}>
      <h2>Change Super Admin Password</h2>
      {step === 1 && (
        <>
          <p>Enter Super Admin Email</p>
          <input value={email} onChange={e=>setEmail(e.target.value)} />
          <button onClick={sendOtp}>Send OTP</button>
        </>
      )}

      {step === 2 && (
        <>
          <p>Enter OTP sent to {email}</p>
          <input value={otp} onChange={e=>setOtp(e.target.value)} />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}

     {step === 3 && (
  <>
    <p>Enter New Password</p>
    <input
      type="password"
      placeholder="Enter new password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
    />
    <button onClick={resetPassword}>Update Password</button>
  </>
)}

      <p style={{color:"red"}}>{msg}</p>

<Link to="/" style={{ fontSize: "14px" }}>
          Back to Login
        </Link>
   
    </div>
  );
}
