import { DataTypes } from "sequelize";
import { sequelize } from "../connections/databaseConnection";

export const Datasource = sequelize.define("datasources", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    datasource: {
        type: DataTypes.STRING
    },
    dataset_id: {
        type: DataTypes.STRING
    },
    ingestion_spec: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    datasource_ref: {
        type: DataTypes.STRING,
    },
    retention_period: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    archival_policy: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    purge_policy: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    backup_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    status: {
        type: DataTypes.ENUM("Draft", "Live", "Retired", "Publish"),
        defaultValue: "Draft",
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "druid",
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
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    version: {
        type: DataTypes.INTEGER
    },
    is_primary: {
        type: DataTypes.BOOLEAN
    },
    name: {
        type: DataTypes.STRING
    }
}, {
    tableName: "datasources",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date",
})