require("dotenv").config();

/** @type {import('sequelize').Options} */
const baseConfig = {
  dialect: "mysql",
  logging: false,
};

const common = {
  ...baseConfig,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
};

module.exports = {
  development: common,
  // support NODE_ENV=dev as used in .env
  dev: common,
  test: common,
  production: common,
};


