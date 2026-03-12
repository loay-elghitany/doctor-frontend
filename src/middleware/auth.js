const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.header("Authorization") &&
    req.header("Authorization").startsWith("Bearer ")
  ) {
    token = req.header("Authorization").replace("Bearer ", "");
  }
  // 2. Else, for download routes, check for token in query string
  else if (req.query.token) {
    token = req.query.token;
  }

  // 3. If no token, deny access
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // 4. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = auth;
