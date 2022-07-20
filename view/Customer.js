const uuid = require("uuid");
const MyDatabase = require("../repository/database");
const Credentials = require("./Credentials");

class Customer {
  constructor(firstName, lastName, username, password) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.customerId = uuid.v4();
    this.isActive = true;
    this.totalBalance = 0;
    this.accounts = [];
    this.credentials = new Credentials(username, password);
  }

  static async createCustomer(firstName, lastName, username, password) {
    let db = new MyDatabase();
    const customer = new Customer(firstName, lastName, username, password);
    const newCustomer = await db.createCustomer(customer);
    return newCustomer;
  }

  static async getCustomer(username) {
    const db = new MyDatabase();
    const customer = await db.getCustomer(username);
    return customer;
  }

  static async getAllCustomers() {
    const db = new MyDatabase();
    const customers = await db.getAllCustomers();
    return customers;
  }

  static async disableAccount(customer) {
    const db = new MyDatabase();
    return await db.disableAccount(customer);
  }

  async updateTotalBalance() {
    this.totalBalance = 0;
    const db = new MyDatabase();
    let accounts = await db.getUserAccounts(this.credentials.username);

    for (let i in accounts) {
      this.totalBalance += accounts[i].balance;
    }
  }
  return;
}

module.exports = Customer;
