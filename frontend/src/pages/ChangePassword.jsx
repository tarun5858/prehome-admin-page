// ChangePassword.jsx
import { useState } from "react";

export default function ChangePassword() {
  const [email, setEmail] = useState("tarun.ccl19@gmail.com"); // prefill
  const [step, setStep] = useState(1); // 1=request,2=verify,3=reset
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [msg, setMsg] = useState("");

  async function sendOtp() {
    setMsg("");
    try {
    //   const res = await fetch("https://dynamic-website-backend.onrender.com/auth/request-reset", {
      const res = await fetch("https://dynamic-blog-server-g5ea.onrender.com/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setMsg(data.message || "OTP sent");
      setStep(2);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function verifyOtp() {
    setMsg("");
    try {
      const res = await fetch("https://dynamic-blog-server-g5ea.onrender.com/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
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
      const res = await fetch("https://dynamic-blog-server-g5ea.onrender.com/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setMsg(data.message || "Password reset");
      // optionally redirect to login
      setStep(1);
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setMsg(err.message);
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
          <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          <button onClick={resetPassword}>Reset Password</button>
        </>
      )}

      <p style={{color:"red"}}>{msg}</p>
    </div>
  );
}
