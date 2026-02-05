"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TransactionLogs", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      walletIdFrom: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      walletIdTo: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      amountMinor: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "COMPLETED", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      type: {
        type: Sequelize.ENUM("TRANSFER", "INTEREST"),
        allowNull: false,
      },
      idempotencyKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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

    await queryInterface.addIndex("TransactionLogs", ["idempotencyKey"], {
      unique: true,
      name: "transactionlogs_idempotencykey_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("TransactionLogs", "transactionlogs_idempotencykey_unique");
    await queryInterface.dropTable("TransactionLogs");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TransactionLogs_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TransactionLogs_type";');
  },
};

