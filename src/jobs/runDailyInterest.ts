import dotenv from "dotenv";
import sequelize from "../db";
import { runDailyInterest } from "../services/interestService";

dotenv.config();

async function main() {
  try {
    await sequelize.authenticate();
    await runDailyInterest(new Date());
    // eslint-disable-next-line no-console
    console.log("Daily interest job completed");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Daily interest job failed", err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

void main();

