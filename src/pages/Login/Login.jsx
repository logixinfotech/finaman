import { useState } from "react";
import { Building2, User, Lock, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { authenticateUser } from "../../utils/api";
import "./login.css";

function LoginPage({ onLoginSuccess }) {
  const [comCode, setComCode] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForceLogin, setShowForceLogin] = useState(false);  

const handleLogin = async (e, force = false) => {
  if (e) e.preventDefault();
  setLoading(true);
  setError("");

  try { 
    const res = await authenticateUser({
      com_code: comCode,
      user_id: userId,
      user_pass: password,
      forceLogin: force,
    });

    if (res.cancelled) {
      console.warn("Login request was cancelled.");
      return;
    }

    if (res.alreadyLoggedIn) {
      console.log("Session Conflict: User already logged in elsewhere.");
      setShowForceLogin(true);
      setError("User is already logged in on another device.");
      setLoading(false);
      return;
    }

    const token = res?.token;
    if (!token) throw new Error("No token received from server");
console.log(
  "Login Success!",
  res.permissions ? Object.keys(res.permissions) : "ADMIN (FULL ACCESS)"
);
    
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(res.user));
    sessionStorage.setItem("permissions", JSON.stringify(res.permissions));

    console.log("Storage Sync: Token and Permissions saved to sessionStorage.");
    onLoginSuccess();
  } catch (err) {
    console.error("Login Component Error:", err);
    setError(err.response?.data?.message || "Invalid Credentials");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={(e) => handleLogin(e, false)}>
        <div className="login-header">
          <img src="/finaman-logo.png" alt="Finaman ERP" className="login-logo" />
          <h1 className="login-title"><LogIn size={22} /> Finaman ERP</h1>
          <p className="login-subtitle">Secure enterprise resource platform</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Form Inputs */}
        <div className="login-input">
          <Building2 size={18} />
          <input placeholder="Company Code" value={comCode} onChange={(e) => setComCode(e.target.value)} required />
        </div>
        <div className="login-input">
          <User size={18} />
          <input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>
        <div className="login-input">
          <Lock size={18} />
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <span className="eye" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>

        {/* Normal Login Button */}
        {!showForceLogin ? (
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        ) : ( 
          <button 
            type="button" 
            className="login-btn force-btn" 
            onClick={() => handleLogin(null, true)}
          >
            {loading ? "Resetting Session..." : "Logout from other devices & Login"}
          </button>
        )}

        <div className="login-footer">
          © {new Date().getFullYear()} Finaman ERP
        </div>
      </form>
    </div>
  );
}

export default LoginPage;