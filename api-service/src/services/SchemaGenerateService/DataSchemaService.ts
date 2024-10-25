import { inferSchema } from "@jsonhero/schema-infer";
import httpStatus from "http-status";
import _ from "lodash";
import moment from "moment";
import { SchemaGenerationException } from "../../exceptions/SchemaGenerationException";

const DATE_FORMATS = [
    "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "YYYY-DD-MM", "YYYY/MM/DD",
    "DD-MM-YYYY", "MM-DD-YYYY", "MM-DD-YYYY HH:mm:ss", "YYYY/MM/DD HH:mm:ss",
    "YYYY-MM-DD HH:mm:ss", "YYYY-DD-MM HH:mm:ss", "DD/MM/YYYY HH:mm:ss",
    "DD-MM-YYYY HH:mm:ss", "MM-DD-YYYY HH:mm:ss.SSS", "YYYY-MM-DD HH:mm:ss.SSS",
    "YYYY-DD-MM HH:mm:ss.SSS", "YYYY/MM/DD HH:mm:ss.SSS", "DD/MM/YYYY HH:mm:ss.SSS",
    "DD-MM-YYYY HH:mm:ss.SSS", "DD-MM-YYYYTHH:mm:ss.SSSZ", "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-DD-MMTHH:mm:ss.SSSZ", "YYYY/MM/DDTHH:mm:ss.SSSZ", "DD/MM/YYYYTHH:mm:ss.SSSZ",
    "YYYY-DD-MMTHH:mm:ss.SSS", "YYYY/MM/DDTHH:mm:ss.SSS", "DD/MM/YYYYTHH:mm:ss.SSS",
    "MM-DD-YYYYTHH:mm:ss.SSSZ", "DD-MM-YYYYTHH:mm:ssZ", "YYYY-MM-DDTHH:mm:ssZ",
    "YYYY-DD-MMTHH:mm:ssZ", "YYYY/MM/DDTHH:mm:ssZ", "DD/MM/YYYYTHH:mm:ssZ", "MM-DD-YYYYTHH:mm:ssZ",
    "MM-DD-YYYYTHH:mm:ss", "DD-MM-YYYYTHH:mm:ss", "YYYY-MM-DDTHH:mm:ss", "YYYY-DD-MMTHH:mm:ss",
    "YYYY/MM/DDTHH:mm:ss", "DD/MM/YYYYTHH:mm:ss", "DD-MM-YYYY HH:mm:ss.SSSZ", "YYYY-MM-DD HH:mm:ss.SSSZ",
    "YYYY-DD-MM HH:mm:ss.SSSZ", "YYYY/MM/DD HH:mm:ss.SSSZ", "DD/MM/YYYY HH:mm:ss.SSSZ",
    "MM-DD-YYYY HH:mm:ss.SSSZ", "DD-MM-YYYY HH:mm:ssZ", "YYYY-MM-DD HH:mm:ssZ", "YYYY-DD-MM HH:mm:ssZ",
    "YYYY/MM/DD HH:mm:ssZ", "DD/MM/YYYY HH:mm:ssZ", "MM-DD-YYYY HH:mm:ssZ", "DD-MM-YYYYTHH:mm:ss.SSSSSSZ",
    "YYYY-MM-DDTHH:mm:ss.SSSSSSZ", "YYYY-DD-MMTHH:mm:ss.SSSSSSZ", "YYYY/MM/DDTHH:mm:ss.SSSSSSZ",
    "DD/MM/YYYYTHH:mm:ss.SSSSSSZ", "MM-DD-YYYYTHH:mm:ss.SSSSSSZ", "DD/MM/YYYYTHH:mm:ss.SSSSSS",
    "YYYY-DD-MMTHH:mm:ss.SSSSSS", "YYYY/MM/DDTHH:mm:ss.SSSSSS", "YYYY-MM-DDTHH:mm:ss.SSSSSS",
    "MM-DD-YYYYTHH:mm:ss.SSSSSS", "DD-MM-YYYYTHH:mm:ss.SSSSSS", "DD-MM-YYYY HH:mm:ss.SSSSSS",
    "YYYY-MM-DD HH:mm:ss.SSSSSS", "YYYY-DD-MM HH:mm:ss.SSSSSS", "YYYY/MM/DD HH:mm:ss.SSSSSS",
    "DD/MM/YYYY HH:mm:ss.SSSSSS", "MM-DD-YYYY HH:mm:ss.SSSSSS", "DD-MM-YYYY HH:mm:ss.SSSSSSZ",
    "YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ", "YYYY-DD-MMTHH:mm:ss.SSSSSSSSSZ", "YYYY/MM/DDTHH:mm:ss.SSSSSSSSSZ",
    "DD/MM/YYYYTHH:mm:ss.SSSSSSSSSZ", "MM-DD-YYYYTHH:mm:ss.SSSSSSSSSZ", "DD/MM/YYYYTHH:mm:ss.SSSSSSSSS",
    "YYYY-DD-MMTHH:mm:ss.SSSSSSSSS", "YYYY/MM/DDTHH:mm:ss.SSSSSSSSS", "YYYY-MM-DDTHH:mm:ss.SSSSSSSSS",
    "MM-DD-YYYYTHH:mm:ss.SSSSSSSSS", "DD-MM-YYYYTHH:mm:ss.SSSSSSSSS", "DD-MM-YYYY HH:mm:ss.SSSSSSSSS",
    "YYYY-MM-DD HH:mm:ss.SSSSSSSSS", "YYYY-DD-MM HH:mm:ss.SSSSSSSSS", "YYYY/MM/DD HH:mm:ss.SSSSSSSSS",
    "DD/MM/YYYY HH:mm:ss.SSSSSSSSS", "MM-DD-YYYY HH:mm:ss.SSSSSSSSS", "DD-MM-YYYY HH:mm:ss.SSSSSSSSSZ",
    "DD-MM-YYYYTHH:mm:ss.SSSSSSSSSZ",
];

export class SchemaInference {

    public inferSchema(sample: any) {
        if (!Array.isArray(sample)) {
            throw new SchemaGenerationException("Invalid input: sample must be an array.", httpStatus.BAD_REQUEST);
        }
        const removedAllKeys: any[] = []
        const schema = _.map(sample, (value): any => {
            const { cleanedData, removedKeys } = this.removeEmpty(value)
            removedAllKeys.push(...removedKeys)
            return this.validateEpoch(inferSchema(cleanedData).toJSONSchema({ includeSchema: true }), cleanedData, "properties")
        })
        return { schema, removedKeys: removedAllKeys }
    }

    public inferBatchSchema(sample: Map<string, any>[], extractionKey: string) {
        if (!Array.isArray(sample)) {
            throw new SchemaGenerationException("Invalid input: sample must be an array.", httpStatus.BAD_REQUEST);
        }
        const removedAllKeys: any[] = []
        const schema = _.flatMap(sample, (value) => {
            if (extractionKey) {
                const extracted = _.get(value, extractionKey);
                if (extracted) {
                    const { schema, removedKeys } = this.inferSchema(extracted);
                    removedAllKeys.push(...removedKeys)
                    return schema
                } else {
                    throw new SchemaGenerationException("Unable to extract the batch data.", httpStatus.BAD_REQUEST);
                }
            } else {
                throw new SchemaGenerationException("Extraction key not found.", httpStatus.BAD_REQUEST);
            }
        })
        return { schema, removedKeys: removedAllKeys }
    }
    // Only removes empty object and array at all the levels
    private removeEmpty(data: any, parentKey = "", removedKeys: any[] = []) {
        Object.keys(data).forEach((key) => {
            const value = data[key];
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof value === "object" && value !== null) {
                this.removeEmpty(value, fullKey, removedKeys);
                if (_.isEmpty(value)) {
                    delete data[key];
                    removedKeys.push({ "key": fullKey, value });
                }
            }
        });
        return { cleanedData: data, removedKeys };
    }

    private validateEpoch(schema: any, sample: any, path: any) {
        Object.entries(sample).map(([key, value]) => {
            if (value && typeof value == "object") {
                this.validateEpoch(schema, value, `${path}.${key}.properties`)
            }
            const { isValidTimestamp, type } = this.isValidTimestamp(value);
            const format = _.get(schema, `${path}.${key}.format`);
            if (isValidTimestamp) {
                _.set(schema, `${path}.${key}.format`, type)
            }
            else if (format && ["date-time", "time", "date"].includes(format) && !isValidTimestamp) {
                _.unset(schema, `${path}.${key}.format`)
            }
        });
        return schema
    }

    isValidTimestamp(value: any) {
        const dataType = typeof value;
        const epochRegex = /^\d+$/ig;
        switch (dataType) {
            case "string":
                if (epochRegex.test(value)) {
                    const parsedValue = parseInt(value, 10);
                    // Timestamp should be greater than Jan 01 2000 00:00:00 UTC/GMT in seconds
                    return {
                        isValidTimestamp: parsedValue >= 946684800 && moment(parsedValue).isValid(),
                        type: "epoch"
                    }
                } else return {
                    isValidTimestamp: moment(value, DATE_FORMATS, true).isValid(),
                    type: "date-time"
                }
            case "number":
                // Timestamp should be greater than Jan 01 2000 00:00:00 UTC/GMT in seconds
                return {
                    isValidTimestamp: value >= 946684800 && moment(value).isValid(),
                    type: "epoch"
                };
            default:
                return {
                    isValidTimestamp: false,
                    type: ""
                };
        }
    }
}