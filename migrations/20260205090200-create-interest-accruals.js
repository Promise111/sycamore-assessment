"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("InterestAccruals", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      walletId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      principalMinor: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      interestMinor: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("InterestAccruals", ["walletId", "date"], {
      name: "interestaccruals_walletid_date_idx",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("InterestAccruals", "interestaccruals_walletid_date_idx");
    await queryInterface.dropTable("InterestAccruals");
  },
};

