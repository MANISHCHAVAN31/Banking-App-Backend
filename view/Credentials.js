const uuid = require("uuid");

class Credentials {
  constructor(username, password) {
    this.credentialId = uuid.v4();
    this.username = username;
    this.password = password;
  }

  comparePassword(password) {
    return this.password == password;
  }
}
module.exports = Credentials;
