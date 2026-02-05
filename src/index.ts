import express, { type Application ,type Request, type Response } from "express";

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req: Request, res: Response) => {
    res.send('Hello World with TypeScript and Express!');
  });
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });