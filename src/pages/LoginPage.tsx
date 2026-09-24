import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const [authMode, setAuthMode] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto focus first PIN digit on mount
  useEffect(() => {
    if (authMode === "pin") {
      inputRefs[0].current?.focus();
    }
  }, [authMode]);

  const handlePinChange = (index: number, value: string) => {
    const lastChar = value.slice(-1);
    if (lastChar && !/^\d$/.test(lastChar)) return;

    const newPin = [...pin];
    newPin[index] = lastChar;
    setPin(newPin);

    if (lastChar && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (lastChar && index === 3) {
      const fullPin = newPin.join("");
      if (fullPin.length === 4) {
        submitLogin(fullPin, "admin");
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const fullPin = pin.join("");
      if (fullPin.length === 4) {
        submitLogin(fullPin, "admin");
      } else {
        setLoginStatus("error");
        setErrorMessage("Iltimos, 4 xonali PIN kodni to'liq kiriting!");
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setPin(digits);
      inputRefs[3].current?.focus();
      submitLogin(pastedData, "admin");
    }
  };

  const submitLogin = async (secret: string, userToLogin: string = "admin") => {
    if (!secret) {
      setLoginStatus("error");
      setErrorMessage("Iltimos, PIN kod yoki parolni kiriting.");
      return;
    }

    try {
      setIsLoading(true);
      setLoginStatus("idle");
      setErrorMessage("");

      const success = await login(secret, userToLogin);
      if (success) {
        setLoginStatus("success");
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      } else {
        setLoginStatus("error");
        setErrorMessage("PIN kod yoki parol noto'g'ri. Qayta urinib ko'ring.");
        if (authMode === "pin") {
          setPin(["", "", "", ""]);
          inputRefs[0].current?.focus();
        }
      }
    } catch (err: any) {
      setLoginStatus("error");
      setErrorMessage(
        err?.message || "Tizimga kirishda xatolik yuz berdi. Server aloqasini tekshiring."
      );
      if (authMode === "pin") {
        setPin(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[82vh] items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-card p-6 sm:p-8 shadow-2xl glass-panel space-y-6">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="text-center space-y-3 relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-xl shadow-emerald-500/20">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Mandarin <span className="gradient-text-emerald">Portal</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Reys Hisoboti — Tizimga xavfsiz kirish
            </p>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/40 p-1.5 border border-border/80">
          <button
            type="button"
            onClick={() => {
              setAuthMode("pin");
              setLoginStatus("idle");
              setErrorMessage("");
            }}
            className={`flex items-center justify-center space-x-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              authMode === "pin"
                ? "bg-card text-foreground shadow-md border border-emerald-500/30 text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>PIN Kod</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setLoginStatus("idle");
              setErrorMessage("");
            }}
            className={`flex items-center justify-center space-x-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              authMode === "password"
                ? "bg-card text-foreground shadow-md border border-emerald-500/30 text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Login va Parol</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {loginStatus === "error" && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs font-medium text-rose-400 flex items-center justify-center space-x-2 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {loginStatus === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-medium text-emerald-400 flex items-center justify-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Muvaffaqiyatli! Tizimga kirilmoqda...</span>
          </div>
        )}

        {/* Form: PIN Mode */}
        {authMode === "pin" ? (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              submitLogin(pin.join(""), "admin");
            }}
          >
            <div className="text-center space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                4-xonali PIN kodni kiriting
              </label>

              <div className="flex justify-center items-center space-x-3 pt-2">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="pin-input"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.join("").length < 4}
              className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/20 hover:opacity-95 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Kirish (Enter)</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Form: Login va Parol Mode */
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitLogin(password, username);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Foydalanuvchi nomi</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-hidden focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Parol yoki PIN</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm font-medium focus:outline-hidden focus:border-emerald-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full mt-2 flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/20 hover:opacity-95 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Tizimga kirish</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Hint */}
        <div className="pt-2 border-t border-border/50 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center space-x-1">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>Standart PIN: <strong className="text-foreground">2222</strong> (yoki .env paroli)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
