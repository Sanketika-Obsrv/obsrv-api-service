import _ from "lodash";

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

        "SCHEMA_SUGGESTION": {
            "MESSAGE": "Conflict in the Schema Generation",
            "CREATE": {
                "REQUIRED_PROPERTY": {
                    "ADVICE": "The Property looks to be Optional. System has Updated the Property Schema"
                },
                "DATATYPE_PROPERTY": {
                    "ADVICE": "System has choosen highest occurance property value"
                }
            },
            "UPDATE": {
                "REQUIRED_PROPERTY": {
                    "ADVICE": "Might Required to reprocess the existing data"
                },
                "DATATYPE_PROPERTY": {
                    "ADVICE": "Might Required to reprocess the existing data"
                }
            }

        }
    },

    getSchemaDataTypeMessage(conflicts:any, property:string):string{
        const message = _.template(
            `${this.TEMPLATES.SCHEMA_SUGGESTION.MESSAGE} at property: '${property}'. The property type <% _.forEach(conflicts, (value, key, list) => { %><%= key %>: <%= value %> time(s)<%= _.last(list) === value ? '' : ', ' %><% }); %><%= _.isEmpty(conflicts) ? '' : '' %>`)({ conflicts });
        return message
    },

    getSchemaRequiredTypeMessage(conflicts:any, property:string):string{
        const message = _.template(
            `${this.TEMPLATES.SCHEMA_SUGGESTION.MESSAGE} at property: '${property}'. The property <% _.forEach(conflicts, (value, key, list) => { %><%= key %>: only <%= value %> time(s) appeared <%= _.last(list) === value ? '' : '' %><% }); %><%= _.isEmpty(conflicts) ? '' : '' %>`)({ conflicts });
        return message
    }

}
