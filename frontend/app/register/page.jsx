"use client";

import { useState } from "react";
import { RegisterForm } from "@/app/(components)/auth/RegisterForm";
import { registerUser, registerBusiness } from "@/services/api"; // Import API functions
import { useRouter } from "next/navigation";
import { User, Briefcase } from "lucide-react";

export default function RegisterPage() {
  const [registrationType, setRegistrationType] = useState("user"); // 'user' or 'business'
  const [message, setMessage] = useState(null); // For overall page messages
  const router = useRouter();

  // Handler for user registration
  const handleUserRegister = async (userId, password, userWalletAddress) => {
    setMessage(null);
    try {
      const response = await registerUser(userId, password);
      if (response.success) {
        setMessage({ type: "success", text: "User registration successful! Please log in." });
        router.push("/login"); // MODIFIED: Redirect to generic /login
        return { success: true, message: "User registration successful!" };
      } else {
        return { success: false, message: response.message || "User registration failed." };
      }
    } catch (error) {
      console.error("API Error during user registration:", error);
      return { success: false, message: error.message || "An error occurred during user registration." };
    }
  };

  // Handler for business registration
  const handleBusinessRegister = async (businessId, name, symbol, ownerAddress, password) => {
    setMessage(null);
    try {
      const response = await registerBusiness(businessId, name, symbol, ownerAddress, password);
      if (response.success) {
        setMessage({ type: "success", text: "Business registration successful! Please log in." });
        router.push("/login"); // MODIFIED: Redirect to generic /login
        return { success: true, message: "Business registration successful!" };
      } else {
        return { success: false, message: response.message || "Business registration failed." };
      }
    } catch (error) {
      console.error("API Error during business registration:", error);
      return { success: false, message: error.message || "An error occurred during business registration." };
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Register for HashPerks</h1>

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
          onClick={() => setRegistrationType("user")}
          className={`px-6 py-3 rounded-l-lg font-medium transition-colors duration-200 flex items-center ${
            registrationType === "user"
              ? "bg-polka-pink text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <User className="h-5 w-5 mr-2" /> Register as User
        </button>
        <button
          type="button"
          onClick={() => setRegistrationType("business")}
          className={`px-6 py-3 rounded-r-lg font-medium transition-colors duration-200 flex items-center ${
            registrationType === "business"
              ? "bg-polka-pink text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Briefcase className="h-5 w-5 mr-2" /> Register as Business
        </button>
      </div>

      {/* Render the RegisterForm with appropriate props based on type */}
      <RegisterForm
        type={registrationType}
        onUserRegister={handleUserRegister}
        onBusinessRegister={handleBusinessRegister}
      />
    </div>
  );
}
