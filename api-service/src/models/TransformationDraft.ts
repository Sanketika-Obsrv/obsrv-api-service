import moment from "moment";
import { sequelize } from "../connections/databaseConnection";
import { DataTypes } from 'sequelize';
import { DatasetStatus, TransformationMode } from "../types/DatasetModels";

export const DatasetTransformationsDraft = sequelize.define('dataset_transformations_draft', {
    id: {
        type: DataTypes.TEXT,
        primaryKey: true,
        allowNull: false
    },
    dataset_id: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    field_key: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    transformation_function: {
        type: DataTypes.JSON
    },
    mode: {
        type: DataTypes.ENUM("Strict", "Lenient"),
        defaultValue: TransformationMode.Strict
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: DatasetStatus.Draft
    },
    created_by: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "SYSTEM",
    },
    updated_by: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "SYSTEM",
    },
    created_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: moment().format()
    },
    updated_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: moment().format()
    },
    published_date: {
        type: DataTypes.DATE,
        defaultValue: null
    }
}, {
    timestamps: false,
    tableName: 'dataset_transformations_draft'
});