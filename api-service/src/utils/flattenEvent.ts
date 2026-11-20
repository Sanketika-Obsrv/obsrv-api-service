import _ from "lodash";

export const flattenEvent = (obj: any): Record<string, any> => {
  const flattenedObject: Record<string, any> = {};
  const flatten = (value: any, prefix = "") => {
    for (const key in value) {
      if (_.has(value, key)) {
        const propertyName = prefix ? `${prefix}.${key}` : key;
        const propertyValue = value[key];
        const notArray = !_.isArray(propertyValue);

        if (_.isObject(propertyValue) && notArray) {
          flatten(propertyValue, propertyName);
        } else {
          flattenedObject[propertyName] = propertyValue;
        }
      }
    }
  };
  flatten(obj);
  return flattenedObject;
};
