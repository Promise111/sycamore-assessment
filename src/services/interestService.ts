import { Transaction } from "sequelize";
import sequelize from "../db";
import Wallet from "../db/models/Wallet";
import InterestAccrual from "../db/models/InterestAccrual";
import TransactionLog from "../db/models/TransactionLog";
import { calculateDailyInterest } from "./interestMath";

export async function runDailyInterest(date: Date = new Date()): Promise<void> {
  const dateOnly = date.toISOString().slice(0, 10); // YYYY-MM-DD

  const wallets = await Wallet.findAll({
    where: {},
    order: [["id", "ASC"]],
  });

  for (const wallet of wallets) {
    const balance = BigInt(wallet.balanceMinor.toString());
    if (balance <= 0n) continue;

    const interest = calculateDailyInterest(balance, date);
    if (interest <= 0n) continue;

    // Make the application idempotent per wallet+date.
    // If an accrual already exists, skip this wallet.
    const existing = await InterestAccrual.findOne({
      where: {
        walletId: wallet.id,
        date: dateOnly,
      },
    });

    if (existing) continue;

    // Apply interest inside a transaction to keep wallet + records in sync.
    await sequelize.transaction(async (tx: Transaction) => {
      const freshWallet = await Wallet.findByPk(wallet.id, {
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });

      if (!freshWallet) {
        return;
      }

      const principalMinor = BigInt(freshWallet.balanceMinor.toString());
      const interestMinor = calculateDailyInterest(principalMinor, date);
      if (interestMinor <= 0n) {
        return;
      }

      const newBalance = principalMinor + interestMinor;

      await InterestAccrual.create(
        {
          walletId: freshWallet.id,
          date: dateOnly,
          principalMinor,
          interestMinor,
        },
        { transaction: tx },
      );

      await TransactionLog.create(
        {
          walletIdFrom: null,
          walletIdTo: freshWallet.id,
          amountMinor: interestMinor,
          status: "COMPLETED",
          type: "INTEREST",
          idempotencyKey: `interest-${freshWallet.id}-${dateOnly}`,
        },
        { transaction: tx },
      );

      freshWallet.balanceMinor = newBalance;
      await freshWallet.save({ transaction: tx });
    });
  }
}

