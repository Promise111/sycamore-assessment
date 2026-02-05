import { Router } from "express";
import { createTransfer } from "../controllers/transferController";
import { createTransferValidation, handleValidationErrors } from "../validators/transferValidator";

const router = Router();

router.post("/", createTransferValidation, handleValidationErrors, createTransfer);

export default router;

