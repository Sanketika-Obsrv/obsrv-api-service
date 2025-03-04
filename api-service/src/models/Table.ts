import { DataTypes } from 'sequelize';
import { sequelize } from '../connections/databaseConnection';

export const TableDraft = sequelize.define("table_draft", {
    id: {
        type: DataTypes.TEXT,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    dataset_id: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    spec: {
        type: DataTypes.JSON,
        allowNull: false
    },
    spectype: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fields: {
        type: DataTypes.JSON,
        allowNull: false
    },
    ingestion_spec: {
        type: DataTypes.JSON,
        allowNull: true
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    version_key: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_by: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    updated_by: {
        type: DataTypes.TEXT,
        allowNull: false
    }
},
    {
        timestamps: true,
        createdAt: "created_date",
        updatedAt: "updated_date",
        tableName: "table_draft",
    }
);

export default TableDraft;