import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT ?? 3000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default server;

