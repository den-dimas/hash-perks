"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, loginBusiness, registerUser, registerBusiness, getDummyBalance } from "@/services/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // currentUser will store { id, role, token, dummyBalanceRp (for user), etc. }
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading state for auth context
  const router = useRouter();

  // Function to load current user data from localStorage and set state
  const loadAuthState = useCallback(async () => {
    setLoading(true);
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("AuthContext: Loaded user from localStorage:", parsedUser);

        // For user roles, try to refresh dummy balance on load
        if (parsedUser.role === "user" && parsedUser.id && parsedUser.token) {
          try {
            const balanceData = await getDummyBalance(parsedUser.id, parsedUser.token);
            parsedUser.dummyBalanceRp = balanceData.balanceRp; // Update balance
            console.log("AuthContext: Refreshed dummy balance for user:", parsedUser.id, balanceData.balanceRp);
          } catch (error) {
            console.error("AuthContext: Failed to fetch dummy balance on auth load:", error);
            // Keep existing balance or set to 0 if fetching failed
            parsedUser.dummyBalanceRp = parsedUser.dummyBalanceRp || 0;
          }
        }
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("AuthContext: Failed to parse stored user from localStorage:", e);
        localStorage.removeItem("currentUser"); // Clear corrupted data
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
    setLoading(false); // Auth loading complete after initial check
  }, []);

  // Effect to run loadAuthState once on component mount
  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Derived states from currentUser, updated whenever currentUser changes
  const isAuthenticated = !!currentUser;
  const isUser = currentUser?.role === "user";
  const isBusiness = currentUser?.role === "business";

  // Expose user and business objects based on role for convenience
  const user = isUser ? currentUser : null;
  const business = isBusiness ? currentUser : null;

  // Login function
  const login = async (id, password, role) => {
    setLoading(true);
    try {
      let result;
      let newCurrentUser = null;

      if (role === "user") {
        result = await loginUser(id, password);
        if (result.success) {
          newCurrentUser = {
            id: result.user.id,
            role: result.user.role,
            token: result.user.id, // Placeholder token
            dummyBalanceRp: result.user.dummyBalanceRp || 0, // Ensure dummyBalanceRp is set
            subscriptions: result.user.subscriptions || {}, // Ensure subscriptions are set
          };
        }
      } else if (role === "business") {
        result = await loginBusiness(id, password);
        if (result.success) {
          newCurrentUser = {
            id: result.business.id,
            role: result.business.role,
            token: result.business.id, // Placeholder token
          };
        }
      } else {
        throw new Error("Invalid role provided for login.");
      }

      if (result.success && newCurrentUser) {
        setCurrentUser(newCurrentUser);
        localStorage.setItem("currentUser", JSON.stringify(newCurrentUser));
        console.log("AuthContext: Login successful, currentUser set:", newCurrentUser);
        return { success: true, message: result.message };
      } else {
        console.log("AuthContext: Login failed, result:", result);
        return { success: false, message: result.message || "Login failed." };
      }
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      return { success: false, message: error.message || "An unexpected error occurred during login." };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    router.push("/login");
    console.log("AuthContext: User logged out.");
  }, [router]);

  // Signup function (already present, ensuring it uses new login)
  const signup = async (id, password, role, name, symbol, ownerAddress) => {
    setLoading(true);
    try {
      let result;
      if (role === "user") {
        result = await registerUser(id, password);
      } else if (role === "business") {
        result = await registerBusiness(id, name, symbol, ownerAddress, password);
      } else {
        throw new Error("Invalid role for signup.");
      }

      if (result.success) {
        // After successful signup, automatically log them in
        console.log("AuthContext: Signup successful, attempting auto-login.");
        return await login(id, password, role);
      } else {
        console.log("AuthContext: Signup failed, result:", result);
        return { success: false, message: result.message || "Signup failed." };
      }
    } catch (error) {
      console.error("AuthContext: Signup error:", error);
      return { success: false, message: error.message || "An unexpected error occurred during signup." };
    } finally {
      setLoading(false);
    }
  };

  // Function to force refresh currentUser data from backend (for user dummy balance)
  const refreshCurrentUser = useCallback(async () => {
    if (currentUser && currentUser.id && currentUser.role === "user" && currentUser.token) {
      try {
        setLoading(true); // Indicate loading while refreshing
        const balanceData = await getDummyBalance(currentUser.id, currentUser.token);
        const updatedUser = { ...currentUser, dummyBalanceRp: balanceData.balanceRp };
        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        console.log("AuthContext: User data refreshed:", updatedUser);
      } catch (error) {
        console.error("AuthContext: Failed to refresh user data:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser]);

  const value = {
    currentUser,
    user,
    business,
    isAuthenticated,
    isUser,
    isBusiness,
    loading, // This is the loading state for the AuthContext itself
    login,
    logout,
    signup,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
