import { Trino, BasicAuth } from 'trino-client';
import _ from 'lodash';
import { config } from '../configs/Config';

const trino: Trino = Trino.create({
    server: `${config.query_api.lakehouse.host}:${config.query_api.lakehouse.port}`,
    catalog: config.query_api.lakehouse.catalog,
    schema: config.query_api.lakehouse.schema,
    auth: new BasicAuth(config.query_api.lakehouse.default_user),
});


const getFormattedData = (data: any[], columnData: any[]) => {
    const formattedData: any[] = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[ i ];
        const jsonRow: any = {};
        for (let j = 0; j < row.length; j++) {
            // assign column only if doesn't start with _hoodie_
            const colName = columnData[ j ];
            if (_.startsWith(colName, "_hoodie_")) {
                continue;
            }
            jsonRow[ colName ] = row[ j ];
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
                        throw {
                            status: 400,
                            message: data.error.message.replace(/line.*: /, ''),
                            code: "BAD_REQUEST" 
                        }
                }
            queryResult = [ ...queryResult, ...(data?.data?.length ?  data.data  : []) ]
        }
        let columns = await iter.map((r: any) => r.columns ?? []).next();
        let finalColumns = columns.value.map((column: any) => {
            return column.name;
        });
        const formattedData = getFormattedData(queryResult, finalColumns);
        return formattedData
}