const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.sendStatus(401); // No token
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ WORKS WITH BOTH { id } AND { userId }
    req.user = {
      id: decoded.id || decoded.userId
    };

    if (!req.user.id) {
      return res.sendStatus(403); // invalid token payload
    }

    next();
  } catch (err) {
    res.sendStatus(403); // Invalid token
  }
};
