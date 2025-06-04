"use client";

import { useState } from "react";
import { LoginForm } from "@/app/(components)/auth/LoginForm"; // We will create/update this component
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth context
import { useRouter } from "next/navigation";
import { User, Briefcase } from "lucide-react";

export default function LoginPage() {
  const [loginType, setLoginType] = useState("user"); // 'user' or 'business'
  const [message, setMessage] = useState(null); // For overall page messages
  const { login } = useAuth(); // Get the login function from AuthContext
  const router = useRouter();

  // Handler for user login
  const handleUserLogin = async (userId, password) => {
    setMessage(null);
    try {
      // Call the login function from AuthContext
      const response = await login(userId, password, "user");
      if (response && response.success) {
        // Assuming login returns { success: true, ... }
        setMessage({ type: "success", text: "User login successful! Redirecting to dashboard..." });
        router.push("/user/dashboard");
        return { success: true };
      } else {
        return { success: false, message: response?.message || "User login failed." };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "An error occurred during login." };
    }
  };

  // Handler for business login
  const handleBusinessLogin = async (businessId, password) => {
    setMessage(null);
    try {
      // Call the login function from AuthContext
      const response = await login(businessId, password, "business");
      if (response && response.success) {
        // Assuming login returns { success: true, ... }
        setMessage({ type: "success", text: "Business login successful! Redirecting to dashboard..." });
        router.push("/business/dashboard");
        return { success: true };
      } else {
        return { success: false, message: response?.message || "Business login failed." };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "An error occurred during login." };
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Login to HashPerks</h1>

      {message && (
        <div
          className={`p-4 mb-4 rounded-md flex items-center ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Type selection tabs */}
      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={() => setLoginType("user")}
          className={`px-6 py-3 rounded-l-lg font-medium transition-colors duration-200 flex items-center ${
            loginType === "user"
              ? "bg-polka-pink text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <User className="h-5 w-5 mr-2" /> Login as User
        </button>
        <button
          type="button"
          onClick={() => setLoginType("business")}
          className={`px-6 py-3 rounded-r-lg font-medium transition-colors duration-200 flex items-center ${
            loginType === "business"
              ? "bg-polka-pink text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Briefcase className="h-5 w-5 mr-2" /> Login as Business
        </button>
      </div>

      {/* Render the LoginForm with appropriate props based on type */}
      <LoginForm type={loginType} onUserLogin={handleUserLogin} onBusinessLogin={handleBusinessLogin} />
    </div>
  );
}
