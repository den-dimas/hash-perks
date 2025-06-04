// File: ./frontend/app/(components)/auth/LoginForm.jsx
"use client";

import { useState } from "react";
import { Loader2, LogIn, XCircle, CheckCircle } from "lucide-react";

export function LoginForm({ type, onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setFormError(null);
    setIsLoading(true);

    if (!identifier || !password) {
      setFormError("All fields are required.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await onLogin(identifier, password, type);
      if (result && result.success) {
        setMessage({ type: "success", text: result.message || "Login successful!" });
        setIdentifier("");
        setPassword("");
      } else {
        setMessage({ type: "error", text: result.message || "Login failed." });
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setMessage({ type: "error", text: err.message || "An unexpected error occurred during login." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={message.type === "success" ? "message-box-success" : "message-box-error"}>
          {message.type === "success" ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      {formError && (
        <div className="message-box-error">
          <XCircle className="h-5 w-5 mr-2" />
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-light-text-primary mb-1">
          {type === "user" ? "User ID" : "Business ID"}:
        </label>
        <input
          type="text"
          id="identifier"
          className="input-field-modern"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={type === "user" ? "Your User ID" : "Your Business ID"}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-light-text-primary mb-1">
          Password:
        </label>
        <input
          type="password"
          id="password"
          className="input-field-modern"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
        {isLoading ? "Logging In..." : "Login"}
      </button>
    </form>
  );
}
