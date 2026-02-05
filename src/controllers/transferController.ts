import { type Request, type Response } from "express";
import transferFunds from "../services/transferService";

export async function createTransfer(req: Request, res: Response) {
  const { fromWalletId, toWalletId, amountMinor, idempotencyKey } = req.body as {
    fromWalletId: number | string;
    toWalletId: number | string;
    amountMinor: number | string;
    idempotencyKey: string;
  };

  try {
    const result = await transferFunds({
      fromWalletId: Number(fromWalletId),
      toWalletId: Number(toWalletId),
      amountMinor: BigInt(amountMinor),
      idempotencyKey,
    });

    return res.status(result.statusCode).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong processing the transfer" });
  }
}

