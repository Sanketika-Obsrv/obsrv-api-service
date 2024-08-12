import { DataTypes } from "sequelize";
import { sequelize } from "../connections/databaseConnection";
  
export const ConnectorInstances = sequelize.define("connector_instances", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    dataset_id: {
        type: DataTypes.STRING
    },
    connector_id: {
        type: DataTypes.STRING
    },
    data_format: {
        type: DataTypes.STRING,
        defaultValue: "json"
    },
    connector_config: {
        type: DataTypes.STRING
    },
    operations_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    status: {
        type: DataTypes.ENUM("Publishing", "Live", "Retired"),
        defaultValue: "Draft"
    },
    connector_state: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    connector_stats: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    created_by: {
        type: DataTypes.STRING,
        defaultValue: "SYSTEM"
    },
    updated_by: {
        type: DataTypes.STRING,
        defaultValue: "SYSTEM"
    },
    published_date: {
        type: DataTypes.NUMBER
    }
}, {
    tableName: "connector_instances",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date"
})