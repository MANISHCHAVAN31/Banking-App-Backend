const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const Customer = require("./view/Customer");
const Bank = require("./view/Bank");
const Account = require("./view/Account");
const JWTToken = require("./JWT");
const bcrypt = require("bcrypt");
const MyDatabase = require("./repository/database");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// middleware
const isAuthenticated = (req, resp, next) => {
  if (!JWTToken.validateToken(req, "validUser").isValid) {
    resp.status(401).send("Login first to proceed");
    return;
  } else {
    next();
  }
};

// // function
// const updateTotalBalance = async (customer) => {
//   newTotalBalance = 0;
//   console.log(customer.accounts);
//   for (let i in customer.accounts) {
//     newTotalBalance = newTotalBalance + customer.accounts[i].balance;
//   }

//   const db = new MyDatabase();
//   await db.updateTotalBalance(customer, newTotalBalance);
//   return;
// };

app.post("/login", async (req, resp) => {
  let { username, password } = req.body;

  if (typeof username != "string") {
    resp.status(401).send("invalid username");
    return;
  }

  if (typeof password != "string") {
    resp.status(401).send("invalid password");
    return;
  }

  const customer = await Customer.getCustomer(username);
  if (customer === null) {
    resp.status(404).send("Username not found");
    return;
  }
  const isValidPassword = await bcrypt.compare(
    password,
    customer.credential.password
  );

  if (!isValidPassword) {
    resp.status(400).send("Password is invalid");
    return;
  }

  let jwtToken = new JWTToken(customer.id, customer.credential.username);
  let loginToken = jwtToken.createToken();
  resp.cookie("validUser", loginToken);

  resp.status(200).send(customer);
});

app.get("/logout", isAuthenticated, (req, resp) => {
  resp.clearCookie("validUser");
  resp.status(200).send("User logged out successfully");
});

// customers
app.post("/createCustomer", isAuthenticated, async (req, resp) => {
  let { firstName, lastName, username, password } = req.body;

  if (typeof firstName != "string") {
    resp.status(406).send("First name passed is not a string");
    return;
  }
  if (typeof lastName != "string") {
    resp.status(406).send("Last name passed is not a string");
    return;
  }
  if (typeof username != "string") {
    resp.status(406).send("Username passed is not a string");
    return;
  }
  if (typeof password != "string") {
    resp.status(406).send("Password passed is not a string");
    return;
  }

  let isExistingUsername = await Customer.getCustomer(username);

  if (isExistingUsername !== null) {
    resp.status(400).send("User with this username already present");
    return;
  }

  let customer = await Customer.createCustomer(
    firstName,
    lastName,
    username,
    password
  );
  resp.status(200).send(customer);
});

app.post("/getCustomer", isAuthenticated, async (req, resp) => {
  const { username } = req.body;
  if (typeof username != "string") {
    resp.status(406).send("Username passed is not a string");
    return;
  }

  const customer = await Customer.getCustomer(username);
  resp.status(200).send(customer);
});

app.get("/getAllCustomers", isAuthenticated, async (req, resp) => {
  const customers = await Customer.getAllCustomers();
  resp.status(200).send(customers);
});

app.post("/disableCustomer", async (req, resp) => {
  const { username } = req.body;

  const customer = await Customer.getCustomer(username);

  if (customer === null) {
    resp.status(404).send("Customer not found");
    return;
  }

  let disableCustomer = await Customer.disableAccount(customer);
});

// bank
app.post("/createBank", isAuthenticated, async (req, resp) => {
  let { fullName, abbreviation } = req.body;

  if (typeof fullName != "string") {
    resp.status(406).send("Full name passed is not a string");
    return;
  }
  if (typeof abbreviation != "string") {
    resp.status(406).send("Abbreviation passed is not a string");
    return;
  }

  const isExistingBank = await Bank.getBank(abbreviation);

  if (isExistingBank !== null) {
    resp.status(400).send("Bank with this abbreviation already exists");
    return;
  }

  let bank = await Bank.createBank(fullName, abbreviation);
  resp.status(200).send(bank);
});

app.get("/getAllBanks", isAuthenticated, async (req, resp) => {
  const banks = await Bank.getAllBanks();
  resp.status(200).send(banks);
});

// accounts
app.post("/createAccount", isAuthenticated, async (req, resp) => {
  let { username, bankAbbreviation } = req.body;

  if (typeof username != "string") {
    resp.status(406).send("Username passed is not a string");
    return;
  }

  if (typeof bankAbbreviation != "string") {
    resp.status(406).send("Bank abbreviation passed is not a string");
    return;
  }

  let customer = await Customer.getCustomer(username);

  if (customer === null) {
    resp.status(404).send("Customer not found");
    return;
  }

  let bank = await Bank.getBank(bankAbbreviation);

  if (bank === null) {
    resp.status(404).send("Bank not found");
    return;
  }

  let customerAccounts = await Account.checkBankAccountPresent(customer, bank);

  if (customerAccounts !== null) {
    resp.status(400).send("Customer already has account in this bank");
    return;
  }

  // create new account
  const account = await Account.createAccount(customer, bank);
  resp.status(200).send(account);
});

app.post("/getUserAccounts", isAuthenticated, async (req, resp) => {
  const { username } = req.body;

  if (typeof username !== "string") {
    resp.status(200).send("Username passed is not a string");
    return;
  }

  let existingCustomer = await Customer.getCustomer(username);

  if (existingCustomer === null) {
    resp.status(404).send("Customer not found");
    return;
  }
  let accounts = await Account.getUserAccounts(existingCustomer);
  resp.status(200).send(accounts);
});

// deposit amount
app.post("/deposit", isAuthenticated, async (req, resp) => {
  const { username, bankAbbreviation, depositAmount } = req.body;

  if (typeof username != "string") {
    resp.status(406).send("Username passed is not a string");
    return;
  }
  if (typeof bankAbbreviation != "string") {
    resp.status(406).send("Bank Abbreviation passed is not a string");
    return;
  }
  if (typeof depositAmount != "number") {
    resp.status(406).send("Deposit Amount passed is not a number");
    return;
  }

  // get a bank
  const bank = await Bank.getBank(bankAbbreviation);

  if (bank === null) {
    resp.status(404).send("Bank not found");
    return;
  }

  // get a customer
  const customer = await Customer.getCustomer(username);
  if (customer === null) {
    resp.status(404).send("Customer not found");
    return;
  }

  let accountObj = new Account();
  let account = await accountObj.deposit(customer, bank, depositAmount);

  if (account[0] !== 1) {
    resp.status(400).send("Something went wrong");
    return;
  }
  resp.status(200).send("Deposit successful");
});

app.post("/withdrawal", isAuthenticated, async (req, resp) => {
  let { username, bankAbbreviation, withdrawAmount } = req.body;

  if (typeof username != "string") {
    resp.status(406).send("Username passed is not a string");
    return;
  }
  if (typeof bankAbbreviation != "string") {
    resp.status(406).send("Bank Abbreviation passed is not a string");
    return;
  }
  if (typeof withdrawAmount != "number") {
    resp.status(406).send("Withdraw Amount passed is not a number");
    return;
  }

  // get a bank
  const bank = await Bank.getBank(bankAbbreviation);

  if (bank === null) {
    resp.status(404).send("Bank not found");
    return;
  }
  // get a customer
  const customer = await Customer.getCustomer(username);

  if (customer === null) {
    resp.status(404).send("Customer not found");
    return;
  }

  let accountObj = new Account();
  let account = await accountObj.withdrawal(customer, bank, withdrawAmount);

  if (account === "Insufficient Balance") {
    resp.status(400).send(account);
    return;
  }

  if (account && account[0] !== 1) {
    resp.status(400).send("Something went wrong");
    return;
  }
  resp.status(200).send("Withdrawal successful");
});

app.post("/transfer", isAuthenticated, async (req, resp) => {
  let {
    debitCustomerUsername,
    debitCustomerBankAbbriviation,
    creditCustomerUsername,
    creditCustomerBankAbbriviation,
    transferAmount,
  } = req.body;

  if (typeof debitCustomerUsername != "string") {
    resp.status(406).send("Debit Customer username passed is not a string");
    return;
  }

  if (typeof debitCustomerBankAbbriviation != "string") {
    resp
      .status(406)
      .send("Debit Customer Bank Abbriviation passed is not a string");
    return;
  }
  if (typeof creditCustomerUsername != "string") {
    resp.status(406).send("Credit Customer username passed is not a string");
    return;
  }
  if (typeof creditCustomerBankAbbriviation != "string") {
    resp
      .status(406)
      .send("Credit Customer Bank Abbriviation passed is not a string");
    return;
  }
  if (typeof transferAmount != "number") {
    resp.status(406).send("Transfer Amount passed is not a number");
    return;
  }

  const debitCustomer = await Customer.getCustomer(debitCustomerUsername);

  if (debitCustomer === null) {
    resp.status(404).send("Debit customer not found");
    return;
  }

  const creditCustomer = await Customer.getCustomer(creditCustomerUsername);
  if (creditCustomer === null) {
    resp.status(404).send("Credit customer not found");
    return;
  }

  const debitBank = await Bank.getBank(debitCustomerBankAbbriviation);

  if (debitBank === null) {
    resp.status(404).send("Debit customer bank not found");
    return;
  }

  const creditBank = await Bank.getBank(creditCustomerBankAbbriviation);

  if (creditBank === null) {
    resp.status(404).send("Credit customer bank not found");
    return;
  }

  const accountObj = new Account();
  const transaction = await accountObj.transfer(
    debitCustomer,
    debitBank,
    creditCustomer,
    creditBank,
    transferAmount
  );

  if (transaction === "Insufficient Balance") {
    resp.status(400).send(transaction);
    return;
  }

  if (transaction[0][0] !== 1 && transaction[1][0] !== 1) {
    resp.status(400).send("Something went wrong");
    return;
  }

  resp.status(200).send("Transaction completed successfully");
});

app.get("/isAuthenticated", (req, resp) => {
  if (!JWTToken.validateToken(req, "validUser").isValid) {
    resp.status(401).send("Login first to proceed");
    return;
  } else {
    resp.status(200).send("User is Authenticated");
  }
});

// running server
app.listen(9000, () => {
  console.log("Server running at 9000");
});
