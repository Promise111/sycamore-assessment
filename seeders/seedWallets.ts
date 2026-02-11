import dotenv from "dotenv";
import sequelize from "../src/db";
import Wallet from "../src/db/models/Wallet";

dotenv.config();

async function main() {
  try {
    await sequelize.authenticate();

    await Wallet.bulkCreate(
      [
        { userId: "alice", balanceMinor: 100_000n },
        { userId: "bob", balanceMinor: 50_000n },
      ],
      { ignoreDuplicates: true }
    );
  } finally {
    await sequelize.close();
  }
}

void main();