import { sequelize } from "../connections/databaseConnection";
import { DataTypes } from 'sequelize';

export const QueryTemplate = sequelize.define('query_templates', {
    template_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    template_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    query: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    query_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_by: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "SYSTEM",
    },
    updated_by: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "SYSTEM",
    }
}, {
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date',
    tableName: "query_templates"
});