import { sequelize } from "../connections/databaseConnection";
import { DataTypes } from 'sequelize';
import moment from "moment";

export const DatasetDraft = sequelize.define('datasets_draft', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  dataset_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  extraction_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  validation_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  dedup_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  data_schema: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  denorm_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  router_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  dataset_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Draft'),
    allowNull: true,
    defaultValue: "Draft"
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "SYSTEM",
  },
  updated_by: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "SYSTEM",
  },
  created_date: {
    type: DataTypes.STRING,
    defaultValue: moment().format()
  },
  updated_date: {
    type: DataTypes.STRING,
    defaultValue: moment().format()
  },
  published_date: {
    type: DataTypes.STRING,
    allowNull: true
  },
  client_state: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: "datasets_draft",
  timestamps: false
});