import express, { type Application } from "express";
import transferRouter from "./routes/transfer";
import healthRouter from "./routes/health";

const app: Application = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/transfer", transferRouter);

export default app;


