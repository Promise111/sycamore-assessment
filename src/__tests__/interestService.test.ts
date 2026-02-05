import sequelize from "../db";
import Wallet from "../db/models/Wallet";
import InterestAccrual from "../db/models/InterestAccrual";
import TransactionLog from "../db/models/TransactionLog";
import { runDailyInterest } from "../services/interestService";

describe("interestService - runDailyInterest", () => {
  const date = new Date("2025-01-01T00:00:00.000Z");

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await InterestAccrual.destroy({ where: {} });
    await TransactionLog.destroy({ where: {} });
    await Wallet.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("creates accruals and updates balances for wallets with positive balance", async () => {
    const wallet = await Wallet.create({ userId: "user-interest", balanceMinor: 100_000n });

    await runDailyInterest(date);

    const accruals = await InterestAccrual.findAll({ where: { walletId: wallet.id } });
    expect(accruals.length).toBe(1);

    const updatedWallet = await Wallet.findByPk(wallet.id);
    expect(updatedWallet).not.toBeNull();
    expect(BigInt(updatedWallet!.balanceMinor.toString())).toBeGreaterThan(100_000n);

    const logs = await TransactionLog.findAll({ where: { type: "INTEREST" } });
    expect(logs.length).toBe(1);
  });

  it("is idempotent per wallet per day", async () => {
    const wallet = await Wallet.create({ userId: "user-interest", balanceMinor: 100_000n });

    await runDailyInterest(date);
    const afterFirst = await Wallet.findByPk(wallet.id);

    await runDailyInterest(date);
    const afterSecond = await Wallet.findByPk(wallet.id);

    expect(afterFirst?.balanceMinor.toString()).toBe(afterSecond?.balanceMinor.toString());

    const accruals = await InterestAccrual.findAll({ where: { walletId: wallet.id } });
    expect(accruals.length).toBe(1);
  });
});

