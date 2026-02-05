import Redis, { type RedisOptions } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const {
  REDIS_HOST = "127.0.0.1",
  REDIS_PORT = "6379",
  REDIS_USER,
  REDIS_PASS,
} = process.env;

const redisOptions: RedisOptions = {
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
};

if (REDIS_USER) {
  redisOptions.username = REDIS_USER;
}

if (REDIS_PASS) {
  redisOptions.password = REDIS_PASS;
}

const redis = new Redis(redisOptions);

export default redis;

