import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../index";

export interface InterestAccrualAttributes {
  id: number;
  walletId: number;
  // Stored as DATEONLY in the database, represented as YYYY-MM-DD string in code.
  date: string;
  principalMinor: bigint;
  interestMinor: bigint;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InterestAccrualCreationAttributes = Optional<
  InterestAccrualAttributes,
  "id" | "createdAt" | "updatedAt"
>;

class InterestAccrual
  extends Model<InterestAccrualAttributes, InterestAccrualCreationAttributes>
  implements InterestAccrualAttributes
{
  declare id: number;
  declare walletId: number;
  declare date: string;
  declare principalMinor: bigint;
  declare interestMinor: bigint;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

InterestAccrual.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    walletId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    principalMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    interestMinor: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "InterestAccruals",
  },
);

export default InterestAccrual;

