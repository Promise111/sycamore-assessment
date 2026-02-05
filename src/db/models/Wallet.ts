import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../index";

export interface WalletAttributes {
  id: number;
  userId: string;
  balanceMinor: bigint;
  createdAt?: Date;
  updatedAt?: Date;
}

export type WalletCreationAttributes = Optional<WalletAttributes, "id" | "balanceMinor" | "createdAt" | "updatedAt">;

class Wallet extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  declare id: number;
  declare userId: string;
  declare balanceMinor: bigint;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Wallet.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    balanceMinor: {
      // store amounts in the smallest currency unit
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "Wallets",
  },
);

export default Wallet;

