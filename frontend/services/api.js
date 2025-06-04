// File: ./frontend/services/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong.");
  }
  return data;
};

// --- Auth & Registration API Calls ---

export const registerUser = async (userId, password, walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password, walletAddress }),
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
    const response = await fetch(`${API_BASE_URL}/business`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching all businesses:", error);
    throw error;
  }
};

export const getBusinessContractInfo = async (businessId, token = null, isAuthenticatedCall = false) => {
  if (businessId === "all") {
    return getBusinesses();
  }
  try {
    const headers = { "Content-Type": "application/json" };
    let url = `${API_BASE_URL}/business/${businessId}`;

    if (isAuthenticatedCall) {
      url = `${API_BASE_URL}/business/${businessId}/details`;
      if (token) {
        headers["x-business-id"] = token;
      } else {
        throw new Error("Authentication token is required for authenticated business details.");
      }
    }

    const response = await fetch(url, { headers });
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
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/issue-points`, {
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

export const getBalance = async (businessId, customerAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/balance/${customerAddress}`);
    const data = await handleResponse(response);
    return data.balance;
  } catch (error) {
    console.error("Error getting balance:", error);
    throw error;
  }
};

// REMOVED: redeemPoints API call from here. It will be handled directly via ethers.js on frontend.
// export const redeemPoints = async (businessId, customerAddress, amount, privateKey) => { ... };

// NEW: API call to record a redemption on the backend
export const recordRedemption = async (userId, businessId, customerAddress, amount, loyaltyTokenSymbol, token) => {
  if (!token) {
    throw new Error("User not authenticated. Please log in.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/record-redemption`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": token,
      },
      body: JSON.stringify({ businessId, customerAddress, amount, loyaltyTokenSymbol }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error recording redemption:", error);
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

// --- Dummy Currency & Product Catalog API Calls ---

export const addDummyBalance = async (userId, amount, token) => {
  if (!token) {
    throw new Error("User not authenticated. Please log in.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/add-balance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": token,
      },
      body: JSON.stringify({ amount }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error adding dummy balance:", error);
    throw error;
  }
};

export const getDummyBalance = async (userId, token) => {
  if (!token) {
    throw new Error("User not authenticated. Please log in.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/balance-rp`, {
      headers: {
        "x-user-id": token,
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching dummy balance:", error);
    throw error;
  }
};

export const addProductToCatalog = async (businessId, productData, token) => {
  if (!token) {
    throw new Error("Business not authenticated. Please log in.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-business-id": token,
      },
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error adding product to catalog:", error);
    throw error;
  }
};

export const getProductsByBusiness = async (businessId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/products`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching products for business:", error);
    throw error;
  }
};

export const buyProduct = async (userId, businessId, productId, token) => {
  if (!token) {
    throw new Error("User not authenticated. Please log in.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/buy-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": token,
      },
      body: JSON.stringify({ businessId, productId }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error buying product:", error);
    throw error;
  }
};

// Transaction History API Calls
export const getUserTransactions = async (userId, token) => {
  if (!token) {
    throw new Error("User not authenticated. Please log in.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/transactions`, {
      headers: {
        "x-user-id": token,
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    throw error;
  }
};

export const getBusinessTransactions = async (businessId, token) => {
  if (!token) {
    throw new Error("Business not authenticated. Please log in.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/business/${businessId}/transactions`, {
      headers: {
        "x-business-id": token,
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching business transactions:", error);
    throw error;
  }
};
