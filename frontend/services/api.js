const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong.");
  }
  return data;
};

// --- Auth & Registration API Calls ---

export const registerUser = async (userId, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, message: error.message };
  }
};

export const registerBusiness = async (businessId, name, symbol, ownerAddress, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/business/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, name, symbol, ownerAddress, password }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error registering business:", error);
    return { success: false, message: error.message };
  }
};

export const loginUser = async (userId, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error logging in user:", error);
    return { success: false, message: error.message };
  }
};

export const loginBusiness = async (businessId, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/business`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, password }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error logging in business:", error);
    return { success: false, message: error.message };
  }
};

// --- Business & Loyalty Program Info API Calls ---

export const getBusinesses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/businesses`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching all businesses:", error);
    throw error;
  }
};

export const getBusinessContractInfo = async (businessId, token) => {
  if (businessId === "all") {
    return getBusinesses();
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["x-business-id"] = token;
    }
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/contract-info`, { headers });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching contract info for business ${businessId}:`, error);
    throw error;
  }
};

// --- Loyalty Point Operations API Calls ---

export const issuePoints = async (businessId, customerAddress, amount, token) => {
  if (!token) {
    throw new Error("Business not authenticated. Please log in.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/issue-points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-business-id": token,
      },
      body: JSON.stringify({ customerAddress, amount }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error issuing points:", error);
    throw error;
  }
};

// MODIFIED: Extracts 'balance' from the response object
export const getBalance = async (businessId, customerAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/balance/${customerAddress}`);
    const data = await handleResponse(response);
    return data.balance; // Extract the balance value from the returned object
  } catch (error) {
    console.error("Error getting balance:", error);
    throw error;
  }
};

export const redeemPoints = async (businessId, customerAddress, amount, privateKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/redeem-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerAddress, amount, privateKey }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error redeeming points via API:", error);
    throw error;
  }
};

// --- User Subscriptions API Calls ---

export const subscribeToBusiness = async (userId, businessId, userWalletAddress, token) => {
  if (!token) {
    throw new Error("User not authenticated. Please log in.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": token,
      },
      body: JSON.stringify({ businessId, userWalletAddress }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error subscribing user:", error);
    throw error;
  }
};

export const getUserSubscriptions = async (userId, token) => {
  if (!token) {
    throw new Error("User not authenticated. Please log in.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/subscriptions`, {
      headers: {
        "x-user-id": token,
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error getting user subscriptions:", error);
    throw error;
  }
};
