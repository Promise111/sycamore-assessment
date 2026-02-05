import request from "supertest";
import app from "../app";
import sequelize from "../db";
import Wallet from "../db/models/Wallet";
import TransactionLog from "../db/models/TransactionLog";

jest.mock("../redis", () => {
  const store = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
    },
  };
});

describe("POST /transfer", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await TransactionLog.destroy({ where: {} });
    await Wallet.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("rejects invalid payloads via validation", async () => {
    const res = await request(app).post("/transfer").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("transfers funds between wallets when balance is sufficient", async () => {
    const from = await Wallet.create({ userId: "user-a", balanceMinor: 10_000n });
    const to = await Wallet.create({ userId: "user-b", balanceMinor: 0n });

    const payload = {
      fromWalletId: from.id,
      toWalletId: to.id,
      amountMinor: 5_000,
      idempotencyKey: "transfer-1",
    };

    const res = await request(app).post("/transfer").send(payload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
    expect(res.body.fromWalletId).toBe(from.id);
    expect(res.body.toWalletId).toBe(to.id);

    await from.reload();
    await to.reload();

    expect(from.balanceMinor.toString()).toBe("5000");
    expect(to.balanceMinor.toString()).toBe("5000");

    const log = await TransactionLog.findOne({ where: { idempotencyKey: payload.idempotencyKey } });
    expect(log).not.toBeNull();
    expect(log?.status).toBe("COMPLETED");
  });

  it("fails transfer when balance is insufficient", async () => {
    const from = await Wallet.create({ userId: "user-a", balanceMinor: 1_000n });
    const to = await Wallet.create({ userId: "user-b", balanceMinor: 0n });

    const payload = {
      fromWalletId: from.id,
      toWalletId: to.id,
      amountMinor: 5_000,
      idempotencyKey: "transfer-2",
    };

    const res = await request(app).post("/transfer").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("FAILED");

    await from.reload();
    await to.reload();

    expect(from.balanceMinor.toString()).toBe("1000");
    expect(to.balanceMinor.toString()).toBe("0");

    const log = await TransactionLog.findOne({ where: { idempotencyKey: payload.idempotencyKey } });
    expect(log).not.toBeNull();
    expect(log?.status).toBe("FAILED");
  });

  it("is idempotent for the same idempotencyKey", async () => {
    const from = await Wallet.create({ userId: "user-a", balanceMinor: 10_000n });
    const to = await Wallet.create({ userId: "user-b", balanceMinor: 0n });

    const payload = {
      fromWalletId: from.id,
      toWalletId: to.id,
      amountMinor: 3_000,
      idempotencyKey: "transfer-3",
    };

    const first = await request(app).post("/transfer").send(payload);
    const second = await request(app).post("/transfer").send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.transactionId).toBe(first.body.transactionId);
    expect(second.body.fromBalanceMinor).toBe(first.body.fromBalanceMinor);
    expect(second.body.toBalanceMinor).toBe(first.body.toBalanceMinor);

    await from.reload();
    await to.reload();

    expect(from.balanceMinor.toString()).toBe("7000");
    expect(to.balanceMinor.toString()).toBe("3000");

    const logs = await TransactionLog.findAll({ where: { idempotencyKey: payload.idempotencyKey } });
    expect(logs.length).toBe(1);
  });
});
