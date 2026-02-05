import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const createTransferValidation = [
  body("fromWalletId")
    .exists()
    .withMessage("fromWalletId is required")
    .bail()
    .isInt({ gt: 0 })
    .withMessage("fromWalletId must be a positive integer"),
  body("toWalletId")
    .exists()
    .withMessage("toWalletId is required")
    .bail()
    .isInt({ gt: 0 })
    .withMessage("toWalletId must be a positive integer"),
  body("amountMinor")
    .exists()
    .withMessage("amountMinor is required")
    .bail()
    .isInt({ gt: 0 })
    .withMessage("amountMinor must be a positive integer (in minor units)"),
  body("idempotencyKey")
    .exists()
    .withMessage("idempotencyKey is required")
    .bail()
    .isString()
    .withMessage("idempotencyKey must be a string"),
  body()
    .custom((value) => {
      if (value.fromWalletId == null || value.toWalletId == null) {
        return true;
      }

      return Number(value.fromWalletId) !== Number(value.toWalletId);
    })
    .withMessage("fromWalletId and toWalletId must be different"),
];

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
}

