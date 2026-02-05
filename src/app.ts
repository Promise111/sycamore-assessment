import express, { type Application, type Request, type Response } from "express";
import transferRouter from "./routes/transfer";

const app: Application = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("Service is up and running");
});

app.use("/transfer", transferRouter);

export default app;


