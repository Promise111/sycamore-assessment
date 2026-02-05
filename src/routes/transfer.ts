import { Router, type Request, type Response } from "express";
import transferFunds from "../services/transferService";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { fromWalletId, toWalletId, amountMinor, idempotencyKey } = req.body ?? {};

  if (!fromWalletId || !toWalletId || !amountMinor || !idempotencyKey) {
    return res.status(400).json({
      message: "fromWalletId, toWalletId, amountMinor and idempotencyKey are required",
    });
  }

  if (fromWalletId === toWalletId) {
    return res.status(400).json({
      message: "fromWalletId and toWalletId must be different",
    });
  }

  const parsedAmount = BigInt(amountMinor);
  if (parsedAmount <= 0n) {
    return res.status(400).json({
      message: "amountMinor must be a positive integer (in minor units)",
    });
  }

  try {
    const result = await transferFunds({
      fromWalletId: Number(fromWalletId),
      toWalletId: Number(toWalletId),
      amountMinor: parsedAmount,
      idempotencyKey: String(idempotencyKey),
    });

    return res.status(result.statusCode).json(result.body);
  } catch (err) {
    // Last-resort error handling; internal details are logged server-side in the service.
    return res.status(500).json({ message: "Something went wrong processing the transfer" });
  }
});

export default router;

