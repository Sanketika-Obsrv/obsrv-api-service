import { DataTypes } from "sequelize";
import { sequelize } from "../connections/databaseConnection";

export const DatasetSourceConfig = sequelize.define('dataset_source_config', {
  id: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true
  },
  datasetId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  connectorType: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  connectorConfig: {
    type: DataTypes.JSON,
    allowNull: false
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  connectorStats: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING,
    defaultValue: "SYSTEM",
  },
  updated_by: {
    type: DataTypes.STRING,
    defaultValue: "SYSTEM",
  },
  published_date: {
    type: DataTypes.TIME
  }
}, {
  tableName: 'dataset_source_config',
  timestamps: true,
  createdAt: 'created_date',
  updatedAt: 'updated_date'
});
