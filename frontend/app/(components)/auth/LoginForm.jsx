"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

// LoginForm component now accepts specific handlers for user and business login
export function LoginForm({ type, onUserLogin, onBusinessLogin }) {
  // State for form fields
  const [identifier, setIdentifier] = useState(""); // Will be userId or businessId
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState(null); // For success/error messages within the form
  const [formError, setFormError] = useState(null); // For form validation errors
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setFormError(null);
    setIsLoading(true);

    // Basic form validation
    if (!identifier || !password) {
      setFormError("All fields are required.");
      setIsLoading(false);
      return;
    }

    let result;
    try {
      if (type === "user") {
        // Call the passed-in user login handler
        result = await onUserLogin(identifier, password);
      } else {
        // type === 'business'
        // Call the passed-in business login handler
        result = await onBusinessLogin(identifier, password);
      }

      if (result && result.success) {
        setMessage({ type: "success", text: result.message || "Login successful!" });
        // Fields are not cleared on success, as a redirect will happen
      } else {
        setMessage({ type: "error", text: result.message || "Login failed. Please check your credentials." });
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
        <div
          className={`p-4 rounded-md flex items-center ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-md bg-red-100 text-red-800 flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-1">
          {type === "user" ? "User ID:" : "Business ID:"}
        </label>
        <input
          type="text"
          id="identifier"
          className="input-field-modern"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={type === "user" ? "Your user ID" : "Your business ID"}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
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

      <button type="submit" className="btn-primary-dark w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        {type === "user" ? "Login as User" : "Login as Business"}
      </button>
    </form>
  );
}
