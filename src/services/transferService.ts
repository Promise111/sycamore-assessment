import { UniqueConstraintError, Transaction } from "sequelize";
import sequelize from "../db";
import redis from "../redis";
import Wallet from "../db/models/Wallet";
import TransactionLog, { type TransactionStatus, type TransactionType } from "../db/models/TransactionLog";

type TransferPayload = {
  fromWalletId: number;
  toWalletId: number;
  amountMinor: bigint;
  idempotencyKey: string;
};

type TransferResultBody = {
  transactionId: number;
  status: TransactionStatus;
  type: TransactionType;
  fromWalletId: number;
  toWalletId: number;
  amountMinor: string;
  fromBalanceMinor: string;
  toBalanceMinor: string;
};

type TransferResult = {
  statusCode: number;
  body: TransferResultBody;
};

const IDEMPOTENCY_TTL_SECONDS = 60 * 60; // 1 hour

async function readCachedResult(key: string): Promise<TransferResult | null> {
  const raw = await redis.get(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TransferResult;
    return parsed;
  } catch {
    return null;
  }
}

async function cacheResult(key: string, result: TransferResult): Promise<void> {
  await redis.set(key, JSON.stringify(result), "EX", IDEMPOTENCY_TTL_SECONDS);
}

async function transferFunds(payload: TransferPayload): Promise<TransferResult> {
  const redisKey = `transfer:idempotency:${payload.idempotencyKey}`;

  const cached = await readCachedResult(redisKey);
  if (cached) {
    return cached;
  }

  return sequelize.transaction(async (tx: Transaction) => {
    // Check if this idempotency key already has a log inside the transaction.
    let existingLog = await TransactionLog.findOne({
      where: { idempotencyKey: payload.idempotencyKey },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (existingLog && existingLog.status !== "PENDING") {
      const fromWallet = payload.fromWalletId
        ? await Wallet.findByPk(payload.fromWalletId, { transaction: tx, lock: tx.LOCK.UPDATE })
        : null;
      const toWallet = await Wallet.findByPk(payload.toWalletId, { transaction: tx, lock: tx.LOCK.UPDATE });

      const result: TransferResult = {
        statusCode: 200,
        body: {
          transactionId: existingLog.id,
          status: existingLog.status,
          type: existingLog.type,
          fromWalletId: payload.fromWalletId,
          toWalletId: payload.toWalletId,
          amountMinor: existingLog.amountMinor.toString(),
          fromBalanceMinor: fromWallet ? fromWallet.balanceMinor.toString() : "0",
          toBalanceMinor: toWallet ? toWallet.balanceMinor.toString() : "0",
        },
      };

      await cacheResult(redisKey, result);
      return result;
    }

    let log: TransactionLog;

    try {
      log = await TransactionLog.create(
        {
          walletIdFrom: payload.fromWalletId,
          walletIdTo: payload.toWalletId,
          amountMinor: payload.amountMinor,
          status: "PENDING",
          type: "TRANSFER",
          idempotencyKey: payload.idempotencyKey,
        },
        { transaction: tx },
      );
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        const existing = await TransactionLog.findOne({
          where: { idempotencyKey: payload.idempotencyKey },
          transaction: tx,
          lock: tx.LOCK.UPDATE,
        });

        if (!existing) {
          throw err;
        }

        const fromWallet = payload.fromWalletId
          ? await Wallet.findByPk(payload.fromWalletId, { transaction: tx, lock: tx.LOCK.UPDATE })
          : null;
        const toWallet = await Wallet.findByPk(payload.toWalletId, { transaction: tx, lock: tx.LOCK.UPDATE });

        const result: TransferResult = {
          statusCode: 200,
          body: {
            transactionId: existing.id,
            status: existing.status,
            type: existing.type,
            fromWalletId: payload.fromWalletId,
            toWalletId: payload.toWalletId,
            amountMinor: existing.amountMinor.toString(),
            fromBalanceMinor: fromWallet ? fromWallet.balanceMinor.toString() : "0",
            toBalanceMinor: toWallet ? toWallet.balanceMinor.toString() : "0",
          },
        };

        await cacheResult(redisKey, result);
        return result;
      }

      throw err;
    }

    const fromWallet = await Wallet.findByPk(payload.fromWalletId, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    const toWallet = await Wallet.findByPk(payload.toWalletId, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!fromWallet || !toWallet) {
      log.status = "FAILED";
      await log.save({ transaction: tx });

      const result: TransferResult = {
        statusCode: 400,
        body: {
          transactionId: log.id,
          status: log.status,
          type: log.type,
          fromWalletId: payload.fromWalletId,
          toWalletId: payload.toWalletId,
          amountMinor: payload.amountMinor.toString(),
          fromBalanceMinor: fromWallet ? fromWallet.balanceMinor.toString() : "0",
          toBalanceMinor: toWallet ? toWallet.balanceMinor.toString() : "0",
        },
      };

      await cacheResult(redisKey, result);
      return result;
    }

    const currentFromBalance = BigInt(fromWallet.balanceMinor.toString());
    if (currentFromBalance < payload.amountMinor) {
      log.status = "FAILED";
      await log.save({ transaction: tx });

      const result: TransferResult = {
        statusCode: 400,
        body: {
          transactionId: log.id,
          status: log.status,
          type: log.type,
          fromWalletId: payload.fromWalletId,
          toWalletId: payload.toWalletId,
          amountMinor: payload.amountMinor.toString(),
          fromBalanceMinor: fromWallet.balanceMinor.toString(),
          toBalanceMinor: toWallet.balanceMinor.toString(),
        },
      };

      await cacheResult(redisKey, result);
      return result;
    }

    const newFromBalance = currentFromBalance - payload.amountMinor;
    const newToBalance = BigInt(toWallet.balanceMinor.toString()) + payload.amountMinor;

    fromWallet.balanceMinor = newFromBalance;
    toWallet.balanceMinor = newToBalance;

    await fromWallet.save({ transaction: tx });
    await toWallet.save({ transaction: tx });

    log.status = "COMPLETED";
    await log.save({ transaction: tx });

    const result: TransferResult = {
      statusCode: 200,
      body: {
        transactionId: log.id,
        status: log.status,
        type: log.type,
        fromWalletId: payload.fromWalletId,
        toWalletId: payload.toWalletId,
        amountMinor: payload.amountMinor.toString(),
        fromBalanceMinor: newFromBalance.toString(),
        toBalanceMinor: newToBalance.toString(),
      },
    };

    await cacheResult(redisKey, result);
    return result;
  });
}

export default transferFunds;

