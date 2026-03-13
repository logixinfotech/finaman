import { useState } from "react";
import { Building2, User, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { authenticateUser } from "../../utils/api";
import "./login.css";

function LoginPage({ onLoginSuccess }) {
  const [comCode, setComCode] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
const res = await authenticateUser({
  com_code: comCode,
  user_id: userId,
  user_pass: password,
});

const token = res?.token || res?.Token;
if (!token) throw new Error("Token not received"); 
sessionStorage.setItem("token", token); 
sessionStorage.setItem("user", JSON.stringify(res.user));

onLoginSuccess();

    } catch {
      setError("Invalid Company Code / User ID / Password");
    } finally {
      setLoading(false);
      
    }
  }; 

  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={handleLogin}> 
        <div className="login-header">
          <img
            src="/finaman-logo.png"
            alt="Finaman ERP"
            className="login-logo"
          />

          <h1 className="login-title">
            <LogIn size={22} /> Finaman ERP
          </h1>
          <p className="login-subtitle">
            Secure enterprise resource platform
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}
 
        <div className="login-input">
          <Building2 size={18} />
          <input
            placeholder="Company Code"
            value={comCode}
            onChange={(e) => setComCode(e.target.value)}
            required
          />
        </div> 
        <div className="login-input">
          <User size={18} />
          <input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
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
          <span
            className="eye"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div> 
        <button className="login-btn" disabled={loading}>
          {loading ? "Authenticating..." : "Login"}
        </button>

        <div className="login-footer">
          © {new Date().getFullYear()} Finaman ERP
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
