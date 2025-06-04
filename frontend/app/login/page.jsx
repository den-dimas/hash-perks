// File: ./frontend/app/login/page.jsx
"use client";

import { useState } from "react";
import { LoginForm } from "@/app/(components)/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Briefcase } from "lucide-react";

export default function LoginPage() {
  const [loginType, setLoginType] = useState("user");
  const [message, setMessage] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (id, password, type) => {
    setMessage(null);
    const result = await login(id, password, type);
    if (result.success) {
      setMessage({ type: "success", text: result.message || "Login successful!" });
      if (type === "user") {
        router.push("/user/dashboard");
      } else {
        router.push("/business/dashboard");
      }
    } else {
      setMessage({ type: "error", text: result.message || "Login failed." });
    }
    return result;
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-light-bg-secondary rounded-2xl shadow-medium-shadow border border-gray-200">
      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">Login to HashPerks</h1>

      {message && (
        <div className={message.type === "success" ? "message-box-success" : "message-box-error"}>{message.text}</div>
      )}

      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={() => setLoginType("user")}
          className={`px-6 py-3 rounded-l-xl font-medium transition-colors duration-200 flex items-center ${
            loginType === "user"
              ? "bg-accent-green text-white shadow-md"
              : "bg-light-bg-primary text-light-text-secondary hover:bg-gray-100"
          }`}
        >
          <User className="h-5 w-5 mr-2" /> Login as User
        </button>
        <button
          type="button"
          onClick={() => setLoginType("business")}
          className={`px-6 py-3 rounded-r-xl font-medium transition-colors duration-200 flex items-center ${
            loginType === "business"
              ? "bg-accent-green text-white shadow-md"
              : "bg-light-bg-primary text-light-text-secondary hover:bg-gray-100"
          }`}
        >
          <Briefcase className="h-5 w-5 mr-2" /> Login as Business
        </button>
      </div>

      <LoginForm type={loginType} onLogin={handleLogin} />

      <p className="text-center text-light-text-secondary mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-accent-blue-light hover:underline font-medium">
          Register here
        </Link>
      </p>
    </div>
  );
}
