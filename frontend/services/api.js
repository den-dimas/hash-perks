const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong.");
  }
  return data;
};

// --- Auth & Registration API Calls ---

// MODIFIED: registerUser now accepts walletAddress and sends it
export const registerUser = async (userId, password, walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password, walletAddress }), // Include walletAddress
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, message: error.message };
  }
};

export const registerBusiness = async (businessId, name, symbol, ownerAddress, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/business`, {
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

export const getBalance = async (businessId, customerAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/balance/${customerAddress}`);
    const data = await handleResponse(response);
    return data.balance;
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
    // No token needed for this public endpoint
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
