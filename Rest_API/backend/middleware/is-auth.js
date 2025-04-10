const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secretkey");
  } catch (ex) {
    return res.status(500).send({ message: "Invalid token" });
  }
  if (!decodedToken) {
    return res
      .status(401)
      .send({ message: "Access denied. No token provided." });
  }
  req.userId = decodedToken.userId;
  next();
};
