import { DataTypes } from "sequelize";
import { sequelize } from "../connections/databaseConnection";

export const User = sequelize.define("user", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    user_name: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    first_name: {
        type: DataTypes.STRING
    },
    last_name: {
        type: DataTypes.STRING,
    },
    provider: {
        type: DataTypes.STRING,
    },
    email_address: {
        type: DataTypes.STRING,    
    },
    mobile_number: {
        type: DataTypes.STRING,
    },
    created_on: {
        type: DataTypes.STRING,
    },
    last_updated_on: {
        type: DataTypes.STRING,
    },
    roles: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: ["viewer"]
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "active"
    }
}, {
    tableName: "oauth_users",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date"
})
