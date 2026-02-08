import express, { type Application } from "express";
import transferRouter from "./routes/transfer";
import healthRouter from "./routes/health";
import cors from "cors";

const app: Application = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/health", healthRouter);
app.use("/transfer", transferRouter);

export default app;


