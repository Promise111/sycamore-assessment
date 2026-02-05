import express, { type Application, type Request, type Response } from "express";

const app: Application = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

export default app;

