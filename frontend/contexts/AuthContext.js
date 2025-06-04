"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, loginBusiness } from "@/services/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // currentUser will store { id: string, role: 'user' | 'business', token: string }
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for initial auth check
  const router = useRouter();

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user from localStorage:", e);
        localStorage.removeItem("currentUser"); // Clear corrupted data
      }
    }
    setLoading(false); // Auth loading complete after initial check
  }, []);

  // Save user to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  const login = async (identifier, password, type) => {
    setLoading(true);
    let response;
    try {
      if (type === "user") {
        response = await loginUser(identifier, password);
        if (response.success) {
          setCurrentUser({
            id: response.user.id,
            role: "user",
            token: response.user.id, // Placeholder token for simplified auth middleware
          });
        }
      } else if (type === "business") {
        response = await loginBusiness(identifier, password);
        if (response.success) {
          setCurrentUser({
            id: response.business.id,
            role: "business",
            token: response.business.id, // Placeholder token
          });
        }
      } else {
        throw new Error("Invalid login type provided.");
      }

      return response; // Return the full response from API for message handling
    } catch (error) {
      console.error("AuthContext login error:", error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setCurrentUser(null);
    router.push("/login"); // Redirect to login page on logout
  }, [router]);

  // Helper getters derived from currentUser
  const isAuthenticated = !!currentUser;
  const isUser = currentUser?.role === "user";
  const isBusiness = currentUser?.role === "business";

  // Expose user and business objects based on role
  const user = isUser ? currentUser : null;
  const business = isBusiness ? currentUser : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser, // Raw current user object
        user, // User object if role is 'user', else null
        business, // Business object if role is 'business', else null
        isAuthenticated,
        isUser,
        isBusiness,
        login,
        logout,
        loading, // Auth loading state
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
