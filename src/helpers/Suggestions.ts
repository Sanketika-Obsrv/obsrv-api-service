import constants from "../resources/Constants.json";
import _, { constant } from "lodash";

export const SchemaSuggestionTemplate = {
    TEMPLATES: {
        "CONFIG_SUGGESTION": {
            "MESSAGE": "Conflict in the Configurations",
            "UPDATE": {
                "PROCESSING": {
                    "DEDUP_PROPERTY": {
                        "ADVICE": "Could be the chance of duplicating higer volume of data"
                    }
                }
            }
        },
        SCHEMA_SUGGESTION: {
            CREATE: {
                REQUIRED_PROPERTY: {
                    MESSAGE: "Conflict in the Schema Generation",
                    ADVICE: "The Property looks to be Optional. System has updated the property schema to optional",
                    PRIORITY: constants.PRIORITY.MEDIUM
                },
                DATATYPE_PROPERTY: {
                    MESSAGE: "Conflict in the Schema Generation",
                    ADVICE: "System can choose highest occurance property or last appeared object property",
                    PRIORITY: constants.PRIORITY.HIGH
                },
                FORMAT_PROPERTY: {
                    MESSAGE: "The Property",
                    DATE_ADVICE: {
                        MESSAGE: "The System can index all data on this column",
                        PRIORITY: constants.PRIORITY.HIGH
                    },
                    DATETIME_ADVICE: {
                        MESSAGE: "The System can index all data on this column",
                        PRIORITY: constants.PRIORITY.LOW
                    },
                    UUID_ADVICE: {
                        MESSAGE: "Suggest to not to index the high cardinal columns",
                        PRIORITY: constants.PRIORITY.LOW
                    },
                    IPV4_ADVICE: {
                        MESSAGE: "Suggest to Mask the Personal Information",
                        PRIORITY: constants.PRIORITY.LOW
                    },
                    IPV6_ADVICE: {
                        MESSAGE: "Suggest to Mask the Personal Information",
                        PRIORITY: constants.PRIORITY.LOW
                    },
                    EMAIL_ADVICE: {
                        MESSAGE: "Suggest to Mask the Personal Information",
                        PRIORITY: constants.PRIORITY.LOW
                    }
                }
            },
            UPDATE: {
                REQUIRED_PROPERTY: {
                    ADVICE: "Might Required to reprocess the existing data"
                },
                DATATYPE_PROPERTY: {
                    ADVICE: "Might Required to reprocess the existing data"
                }
            }

        }
    },

    getSchemaDataTypeMessage(conflicts: any, property: string): string {
        const message = _.template(
            `${this.TEMPLATES.SCHEMA_SUGGESTION.CREATE.DATATYPE_PROPERTY.MESSAGE} at property: '${property}'. The property type <% _.forEach(conflicts, (value, key, list) => { %><%= key %>: <%= value %> time(s)<%= _.last(list) === value ? '' : ', ' %><% }); %><%= _.isEmpty(conflicts) ? '' : '' %>`)({ conflicts });
        return message
    },

    getSchemaFormatMessage(conflicts: any, property: string): string {
        const conflictKey = _.keys(conflicts)[0];
        return `${this.TEMPLATES.SCHEMA_SUGGESTION.CREATE.FORMAT_PROPERTY.MESSAGE} '${property}' appears to be '${conflictKey}' format type.`;
    },

    getSchemaRequiredTypeMessage(conflicts: any, property: string): string {
        const message = _.template(
            `${this.TEMPLATES.SCHEMA_SUGGESTION.CREATE.REQUIRED_PROPERTY.MESSAGE} at property: '${property}'. The property <% _.forEach(conflicts, (value, key, list) => { %><%= key %>: only <%= value %> time(s) appeared <%= _.last(list) === value ? '' : '' %><% }); %><%= _.isEmpty(conflicts) ? '' : '' %>`)({ conflicts });
        return message
    },

    getSchemaFormatAdvice(conflicts: any):any {
        const conflictKey = `${_.upperCase(_.replace(_.keys(conflicts)[0], "-", ""))}_ADVICE`.replace(/\s/g, "")
        return { 
            "advice": _.get(this.TEMPLATES.SCHEMA_SUGGESTION.CREATE.FORMAT_PROPERTY, `${conflictKey}.MESSAGE`),
            "priority": _.get(this.TEMPLATES.SCHEMA_SUGGESTION.CREATE.FORMAT_PROPERTY, `${conflictKey}.PRIORITY`)
        }
    }

}
