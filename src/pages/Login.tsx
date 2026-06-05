import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiLock, FiMail, FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@nainital.com");
  const [password, setPassword] = useState("Admin@123");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Nainital hero image */}
      <div
        className="hidden lg:flex w-1/2 relative flex-col justify-end p-14 overflow-hidden"
        style={{
          backgroundImage: 'url("/naini-hero.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-[#07090f]/65 to-[#07090f]/15" />
        <div className="relative z-10">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-[0.28em] mb-4"
            style={{ color: "#e8ab3f" }}
          >
            Nainital · Uttarakhand
          </span>
          <h2 className="text-[2.75rem] font-black text-white leading-[1.08] mb-5">
            Manage the<br />NainiStore<br />platform
          </h2>
          <p className="text-sm leading-relaxed max-w-[280px]" style={{ color: "rgba(255,255,255,0.42)" }}>
            Real-time orders, product approvals, delivery partners, and earnings — all in one place.
          </p>
        </div>
      </div>

      {/* Right — dark form panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#07090f" }}>
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: "linear-gradient(135deg, #c8882a 0%, #e8ab3f 100%)",
                boxShadow: "0 8px 28px -4px rgba(200,136,42,0.5)",
              }}
            >
              <span className="text-white font-black text-xl">N</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>
              Sign in to manage NainiStore
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Email
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@nainital.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(232,171,63,0.45)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Password
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(232,171,63,0.45)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                >
                  {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50 mt-2"
              style={{
                background: "linear-gradient(135deg, #c8882a 0%, #e8ab3f 100%)",
                boxShadow: "0 8px 24px -4px rgba(200,136,42,0.4)",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.18)" }}>
            admin@nainital.com · Admin@123
          </p>
        </div>
      </div>
    </div>
  );
}
