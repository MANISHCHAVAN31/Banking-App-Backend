const uuid = require("uuid");
const MyDatabase = require("../repository/database");

class Account {
  constructor(bank) {
    this.accountNo = uuid.v4();
    this.bank = bank;
    this.balance = 1000;
  }

  static async createAccount(customer, bank) {
    let db = new MyDatabase();
    let account = new Account(bank);
    let newAccount = await db.createAccount(customer, account);
    return newAccount;
  }

  static async getUserAccounts(username) {
    let db = new MyDatabase();
    let accounts = await db.getUserAccounts(username);
    return accounts;
  }

  static async checkBankAccountPresent(customer, bank) {
    let db = new MyDatabase();
    let account = await db.checkBankAccountPresent(customer, bank);
    return account;
  }

  async deposit(customer, bank, amount) {
    const db = new MyDatabase();
    const account = await db.deposit(customer, bank, amount);
    return account;
  }

  async withdrawal(customer, bank, amount) {
    const db = new MyDatabase();
    const account = await db.withdrawal(customer, bank, amount);
    return account;
  }

  async transfer(debitCustomer, debitBank, creditCustomer, creditBank, amount) {
    const db = new MyDatabase();
    const transaction = await db.transfer(
      debitCustomer,
      debitBank,
      creditCustomer,
      creditBank,
      amount
    );
    return transaction;
  }
}
module.exports = Account;
