// File: ./frontend/app/register/page.jsx
"use client";

import { useState } from "react";
import { RegisterForm } from "@/app/(components)/auth/RegisterForm";
import { registerUser, registerBusiness } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Briefcase } from "lucide-react";

export default function RegisterPage() {
  const [registrationType, setRegistrationType] = useState("user");
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleUserRegister = async (userId, password, userWalletAddress) => {
    setMessage(null);
    try {
      const response = await registerUser(userId, password, userWalletAddress);
      if (response.success) {
        setMessage({ type: "success", text: "User registration successful! Please log in." });
        router.push("/login");
        return { success: true, message: "User registration successful!" };
      } else {
        return { success: false, message: response.message || "User registration failed." };
      }
    } catch (error) {
      console.error("API Error during user registration:", error);
      return { success: false, message: error.message || "An error occurred during user registration." };
    }
  };

  const handleBusinessRegister = async (businessId, name, symbol, ownerAddress, password) => {
    setMessage(null);
    try {
      const response = await registerBusiness(businessId, name, symbol, ownerAddress, password);
      if (response.success) {
        setMessage({ type: "success", text: "Business registration successful! Please log in." });
        router.push("/login");
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
    <div className="max-w-2xl mx-auto p-6 bg-light-bg-secondary rounded-2xl shadow-medium-shadow border border-gray-200">
      <h1 className="text-3xl font-bold text-light-text-primary mb-6 text-center">Register for HashPerks</h1>

      {message && (
        <div className={message.type === "success" ? "message-box-success" : "message-box-error"}>{message.text}</div>
      )}

      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={() => setRegistrationType("user")}
          className={`px-6 py-3 rounded-l-xl font-medium transition-colors duration-200 flex items-center ${
            registrationType === "user"
              ? "bg-accent-green text-white shadow-md"
              : "bg-light-bg-primary text-light-text-secondary hover:bg-gray-100"
          }`}
        >
          <User className="h-5 w-5 mr-2" /> Register as User
        </button>
        <button
          type="button"
          onClick={() => setRegistrationType("business")}
          className={`px-6 py-3 rounded-r-xl font-medium transition-colors duration-200 flex items-center ${
            registrationType === "business"
              ? "bg-accent-green text-white shadow-md"
              : "bg-light-bg-primary text-light-text-secondary hover:bg-gray-100"
          }`}
        >
          <Briefcase className="h-5 w-5 mr-2" /> Register as Business
        </button>
      </div>

      <RegisterForm
        type={registrationType}
        onUserRegister={handleUserRegister}
        onBusinessRegister={handleBusinessRegister}
      />

      <p className="text-center text-light-text-secondary mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-blue-light hover:underline font-medium">
          Login here
        </Link>
      </p>
    </div>
  );
}
