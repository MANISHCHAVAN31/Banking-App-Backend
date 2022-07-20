const uuid = require("uuid");
const MyDatabase = require("../repository/database");

class Bank {
  constructor(fullName, abbriviation) {
    this.bankId = uuid.v4();
    this.fullName = fullName;
    this.abbriviation = abbriviation;
  }

  static async createBank(fullName, abbreviation) {
    const bank = new Bank(fullName, abbreviation);
    let db = new MyDatabase();
    const newBank = await db.createBank(bank);
    return newBank;
  }

  static async getBank(abbreviation) {
    const db = new MyDatabase();
    const bank = await db.getBank(abbreviation);
    return bank;
  }

  static async getAllBanks() {
    const db = new MyDatabase();
    const banks = await db.getAllBanks();
    return banks;
  }
}

module.exports = Bank;
