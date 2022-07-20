const Pool = require("pg").Pool;
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: "postgres",
  password: "123456",
  database: "bankingsystem",
  host: "127.0.0.1",
  post: "5432",
});

const seq = new Sequelize("bankingsystem", "postgres", "123456", {
  dialect: "postgres",
  host: pool.host,
});

const connectDatabase = async () => {
  try {
    await seq.authenticate();
    console.log("CONNECTION HAS BEEN ESTABLISHED SUCCESSFULLY");
  } catch (error) {
    console.log("UNABLE TO CONNECT DATABASE: ", error);
  }
};
connectDatabase();

// definations
const Customer = seq.define("customers", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  firstname: {
    type: Sequelize.STRING,
  },
  lastname: {
    type: Sequelize.STRING,
  },
  isactive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  totalbalance: {
    type: Sequelize.INTEGER,
  },
});

const Credential = seq.define("credentials", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
  },
});

const Account = seq.define("accounts", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  customerid: {
    type: Sequelize.STRING,
  },
  bankid: {
    type: Sequelize.STRING,
  },
  balance: {
    type: Sequelize.INTEGER,
  },
});

const Bank = seq.define("banks", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  fullname: {
    type: Sequelize.STRING,
  },
  abbreviation: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
});

Customer.hasOne(Credential, {
  foreignKey: "customerid",
});

Customer.hasMany(Account, {
  foreignKey: "customerid",
});

Bank.hasMany(Account, {
  foreignKey: "bankid",
});

Account.belongsTo(Bank, {
  foreignKey: "bankid",
});

// mydb = null;
class MyDatabase {
  constructor() {
    this.pool = pool;
    // if (mydb != null) {
    //   return mydb;
    // }
    // mydb = new MyDatabase();
    // return mydb;
  }

  async createCustomer(customer) {
    try {
      const encPassword = await bcrypt.hash(customer.credentials.password, 10);

      let newCustomer = await Customer.create({
        id: customer.customerId,
        firstname: customer.firstName,
        lastname: customer.lastName,
        totalbalance: customer.totalBalance,
        isactive: customer.isActive,
      });

      let credential = await Credential.create({
        id: customer.credentials.credentialId,
        username: customer.credentials.username,
        password: encPassword,
        customerid: customer.customerId,
      });

      return [newCustomer, credential];
    } catch (error) {
      console.log(error);
    }
  }

  // async updateTotalBalance(customer) {
  //   let newTotalBalance = 0;
  //   for (let i in customer.accounts) {
  //     newTotalBalance += customer.accounts[i].balance;
  //   }
  //   return await Customer.update(
  //     { totalbalance: newTotalBalance },
  //     {
  //       where: {
  //         id: customer.id,
  //       },
  //     }
  //   );
  // }

  async disableAccount(customer) {
    try {
      return await Customer.update(
        { isactive: !customer.isactive },
        {
          where: {
            id: customer.id,
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }

  async getCustomer(username) {
    try {
      return await Customer.findOne({
        include: [
          {
            model: Credential,
            where: {
              username: username,
            },
          },
          {
            model: Account,
            include: {
              model: Bank,
            },
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getAllCustomers() {
    try {
      return await Customer.findAll({
        include: [
          {
            model: Credential,
          },
          {
            model: Account,
            include: {
              model: Bank,
            },
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }
  }

  async createBank(bank) {
    try {
      return await Bank.create({
        id: bank.bankId,
        fullname: bank.fullName,
        abbreviation: bank.abbriviation,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getBank(abbreviation) {
    try {
      return await Bank.findOne({
        where: {
          abbreviation: abbreviation,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getAllBanks() {
    try {
      return await Bank.findAll();
    } catch (error) {
      console.log(error);
    }
  }

  async createAccount(customer, account) {
    try {
      const newAccount = await Account.create({
        id: account.accountNo,
        customerid: customer.id,
        bankid: account.bank.id,
        balance: account.balance,
      });
      console.log(customer);
      const newTBalance = parseInt(customer.totalbalance) + 1000;
      const updateBalance = await Customer.update(
        {
          totalbalance: newTBalance,
        },
        {
          where: { id: customer.id },
        }
      );
      return newAccount;
    } catch (error) {
      console.log(error);
    }
  }

  async checkBankAccountPresent(customer, bank) {
    return await Account.findOne({
      where: {
        customerid: customer.id,
        bankid: bank.id,
      },
    });
  }

  async getUserAccounts(customer) {
    try {
      let accounts = await Account.findAll({
        where: { customerid: customer.id },
        include: {
          model: Bank,
        },
      });
      return accounts;
    } catch (error) {
      console.log(error);
    }
  }

  async deposit(customer, bank, amount) {
    try {
      const account = await Account.findOne({
        where: { bankid: bank.id, customerid: customer.id },
      });

      const depositProcess = await Account.update(
        {
          balance: account.balance + amount,
        },
        {
          where: { bankid: bank.id, customerid: customer.id },
        }
      );

      const newTBalance = parseInt(customer.totalbalance) + amount;
      const updateBalance = await Customer.update(
        {
          totalbalance: newTBalance,
        },
        {
          where: { id: customer.id },
        }
      );
      return depositProcess;
    } catch (error) {
      console.log(error);
    }
  }

  async withdrawal(customer, bank, amount) {
    try {
      const account = await Account.findOne({
        where: { bankid: bank.id, customerid: customer.id },
      });
      if (account.balance < amount) {
        return "Insufficient Balance";
      } else {
        const withdrawalProcess = await Account.update(
          {
            balance: account.balance - amount,
          },
          {
            where: { bankid: bank.id, customerid: customer.id },
          }
        );
        const newTBalance = parseInt(customer.totalbalance) - amount;
        const updateBalance = await Customer.update(
          {
            totalbalance: newTBalance,
          },
          {
            where: { id: customer.id },
          }
        );
        return withdrawalProcess;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async transfer(debitCustomer, debitBank, creditCustomer, creditBank, amount) {
    const debitAccount = await Account.findOne({
      where: { bankid: debitBank.id, customerid: debitCustomer.id },
    });

    if (debitAccount.balance < amount) {
      return "Insufficient Balance";
    }

    const debitDetails = await Account.update(
      {
        balance: debitAccount.balance - amount,
      },
      {
        where: {
          bankid: debitBank.id,
          customerid: debitCustomer.id,
        },
      }
    );

    const creditAccount = await Account.findOne({
      where: { bankid: creditBank.id, customerid: creditCustomer.id },
    });

    const creditDetails = await Account.update(
      {
        balance: creditAccount.balance + amount,
      },
      {
        where: {
          bankid: creditBank.id,
          customerid: creditCustomer.id,
        },
      }
    );

    const newTBalance = parseInt(debitCustomer.totalbalance) - amount;
    const debitCustomerUpdateBalance = await Customer.update(
      {
        totalbalance: newTBalance,
      },
      {
        where: { id: debitCustomer.id },
      }
    );

    const newCreditTBalance = parseInt(creditCustomer.totalbalance) + amount;
    const creditCustomerUpdateBalance = await Customer.update(
      {
        totalbalance: newCreditTBalance,
      },
      {
        where: { id: creditCustomer.id },
      }
    );

    return [debitDetails, creditDetails];
  }
}

module.exports = MyDatabase;
