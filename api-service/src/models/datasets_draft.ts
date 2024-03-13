import { sequelize } from "../connections/databaseConnection";
import { DataTypes } from 'sequelize';

export const datasets_draft = sequelize.define('datasets_draft', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  dataset_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  extraction_config: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  validation_config: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  dedup_config: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  data_schema: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  denorm_config: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  router_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dataset_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Draft'),
    allowNull: true,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_date: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updated_date: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});