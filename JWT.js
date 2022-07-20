const jwt = require("jsonwebtoken");
const secretKet = "BankingBackendStrongKey";

class JWTToken {
  constructor(customerId, username) {
    this.customerId = customerId;
    this.username = username;
    this.isValid = true;
  }

  createToken() {
    return jwt.sign(JSON.stringify(this), secretKet);
  }

  static validateToken(req, cookieIdentifier) {
    let allCookies = req.cookies;

    if (!allCookies[cookieIdentifier]) {
      return false;
    }

    return jwt.verify(allCookies[cookieIdentifier], secretKet);
  }
}

module.exports = JWTToken;
