const authService = require("../services/authService");
const businessService = require("../services/businessService"); // NEW: Import businessService

const authenticateUser = (req, res, next) => {
  const userId = req.headers["x-user-id"]; // Assuming token is just the userId for simplicity
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "User authentication token (x-user-id) is required." });
  }

  const user = authService.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid user authentication token." });
  }

  // Attach user object to request for downstream use
  req.user = user;
  next();
};

const authenticateBusiness = (req, res, next) => {
  const businessId = req.headers["x-business-id"]; // Assuming token is just the businessId for simplicity
  if (!businessId) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Business authentication token (x-business-id) is required." });
  }

  // MODIFIED: Use businessService to get business details
  const business = businessService.getBusinessDetails(businessId); // Get full business details
  if (!business) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid business authentication token." });
  }

  // Attach business object to request for downstream use
  req.business = business;
  next();
};

module.exports = {
  authenticateUser,
  authenticateBusiness,
};
