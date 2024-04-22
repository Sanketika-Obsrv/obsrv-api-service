import { Trino, BasicAuth } from 'trino-client';
import _ from 'lodash';
import fs from 'fs';
import { config } from '../configs/Config';
import constants from '../resources/Constants.json';

const trino: Trino = Trino.create({
    server: `${config.query_api.lakehouse.host}:${config.query_api.lakehouse.port}`,
    catalog: config.query_api.lakehouse.catalog,
    schema: config.query_api.lakehouse.schema,
    auth: new BasicAuth(config.query_api.lakehouse.default_user),
});

const JsonFormatting = async (data: any[], columnData: any[]): Promise<any[]> => {
    
    const formattedData: any[] = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[ i ];
        const jsonRow: any = {};
        for (let j = 0; j < row.length; j++) {
            const colName = columnData[ j ];
            jsonRow[ colName ] = row[ j ];
        }
        // unset all keys starts with _hoodie_
        for (const key in jsonRow) {
            if (key.startsWith("_hoodie_")) {
                delete jsonRow[ key ];
            }
        }
        formattedData.push(jsonRow);
    }
    return formattedData;
}


export const executeLakehouseQuery = async (query: string) => {   
        const iter = await trino.query(query);
        let queryResult: any = []
        for await (let data of iter) {
            if(!_.isEmpty(data.error)){
                switch(data.error.errorType){
                    case "USER_ERROR":
                        throw {
                            status: 400,
                            message: data.error.message.replace(/line.*: /, ''),
                            code: "BAD_REQUEST" 
                        }
                    default:
                        throw constants.FAILED_EXECUTING_QUERY
                }
            }
            queryResult = [ ...queryResult, ...(data.data?.length ? [ data.data ] : []) ]
        }
        queryResult = _.flatMap(queryResult)
        let columns = await iter.map((r: any) => r.columns ?? []).next();
        let finalColumns = columns.value.map((column: any) => {
            return column.name;
        });
        const formattedData = await JsonFormatting(queryResult, finalColumns);
        return formattedData
}