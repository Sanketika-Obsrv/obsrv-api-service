import { DataTypes } from "sequelize";
import { sequelize } from "../connections/databaseConnection";

export const DatasetSourceConfig = sequelize.define("dataset_source_config", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    dataset_id: {
        type: DataTypes.STRING,
    },
    connector_type: {
        type: DataTypes.STRING,
    },
    connector_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    status: {
        type: DataTypes.STRING,
    },
    connector_stats: {
        type: DataTypes.JSON,
        defaultValue: {}
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
    tableName: "dataset_source_config",
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date',
})