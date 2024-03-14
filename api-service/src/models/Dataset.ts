import { DataTypes } from "sequelize";
import { sequelize } from "../connections/databaseConnection";
import { v4 as uuidv4 } from 'uuid';

export const Dataset = sequelize.define("datasets", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    dataset_id: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.STRING
    },
    name: {
        type: DataTypes.STRING
    },
    validation_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    extraction_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    data_schema: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    denorm_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    router_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    dataset_config: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    tags: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    status: {
        type: DataTypes.ENUM("Draft", "Live", "Retired", "Publish"),
        defaultValue: "Draft",
    },
    created_by: {
        type: DataTypes.STRING,
        defaultValue: "SYSTEM",
    },
    updated_by: {
        type: DataTypes.STRING,
        defaultValue: "SYSTEM",
    },
    data_version: {
        type: DataTypes.NUMBER
    }
}, {
    tableName: "datasets",
    timestamps: false
})