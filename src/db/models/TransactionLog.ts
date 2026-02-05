import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../index";

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";
export type TransactionType = "TRANSFER" | "INTEREST";

export interface TransactionLogAttributes {
  id: number;
  walletIdFrom?: number | null;
  walletIdTo: number;
  amountMinor: bigint;
  status: TransactionStatus;
  type: TransactionType;
  idempotencyKey: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TransactionLogCreationAttributes = Optional<
  TransactionLogAttributes,
  "id" | "walletIdFrom" | "status" | "createdAt" | "updatedAt"
>;

class TransactionLog
  extends Model<TransactionLogAttributes, TransactionLogCreationAttributes>
  implements TransactionLogAttributes
{
  declare id: number;
  declare walletIdFrom?: number | null;
  declare walletIdTo: number;
  declare amountMinor: bigint;
  declare status: TransactionStatus;
  declare type: TransactionType;
  declare idempotencyKey: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

TransactionLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    walletIdFrom: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    walletIdTo: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    amountMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    type: {
      type: DataTypes.ENUM("TRANSFER", "INTEREST"),
      allowNull: false,
    },
    idempotencyKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "TransactionLogs",
  },
);

export default TransactionLog;

