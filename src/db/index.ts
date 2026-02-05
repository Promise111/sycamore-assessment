import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const {
  DATABASE_URL,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = process.env;

let sequelize: Sequelize;

if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: "mysql",
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    (DATABASE_NAME as string) ?? "",
    (DATABASE_USERNAME as string) ?? "",
    (DATABASE_PASSWORD as string) ?? "",
    {
      host: DATABASE_HOST ?? "127.0.0.1",
      port: DATABASE_PORT ? Number(DATABASE_PORT) : 3306,
      dialect: "mysql",
      logging: false,
    },
  );
}

export default sequelize;

