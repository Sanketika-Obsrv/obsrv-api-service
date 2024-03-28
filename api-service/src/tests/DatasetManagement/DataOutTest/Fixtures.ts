export const TestQueries = {
    VALID_QUERY:
        '{"context":{"dataSource":"telemetry-events","granularity":"week"},"query":{"queryType":"timeseries","dataSource":"telemetry-events","intervals":{"type":"intervals","intervals":["2024-01-31/2024-02-01"]},"granularity":"week","aggregations":[{"type":"filtered","aggregator":{"type":"count","name":"a0"},"filter":{"type":"not","field":{"type":"null","column":"mid"}},"name":"mid"},{"type":"filtered","aggregator":{"type":"count","name":"a1"},"filter":{"type":"not","field":{"type":"null","column":"ver"}},"name":"a1"}]}}',
    HIGH_LIMIT_NATIVE_QUERY: '{"context":{"dataSource":"rollups-configured","granularity":"day"},"query":{"queryType":"timeseries","dataSource":"rollups-configured","intervals":{"type":"intervals","intervals":["2020-10-31/2024-12-01"]},"granularity":"day","aggregations":[{"type":"filtered","aggregator":{"type":"count","name":"a0"},"filter":{"type":"not","field":{"type":"null","column":"mid"}},"name":"mid"},{"type":"filtered","aggregator":{"type":"count","name":"a1"},"filter":{"type":"not","field":{"type":"null","column":"ver"}},"name":"a1"}],"limit":10000,"threshold":10000}}',
    HIGH_DATE_RANGE_GIVEN_AS_STRING:
        '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"topN","dataSource":"telemetry-events","dimension":"actor_id","threshold":10,"metric":"count","granularity":"all","intervals":"2020-12-30/2021-02-02","aggregations":[{"type":"count","name":"count"}]}}',
    HIGH_THRESHOLD_QUERY:
        '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"scan","dataSource":"telemetry-events","dimension":"mid","threshold":1000,"metric":"count","granularity":"all","intervals":["2020-12-31/2021-01-01"],"aggregations":[]}}',
    WITHOUT_THRESOLD_QUERY:
        '{"context":{"dataSource":"telemetry-events"},"query":{"queryType":"timeBoundary","dataSource":"telemetry-events","dimension":"content_status","metric":"count","granularity":"all","intervals":["2020-12-21/2020-12-22"],"aggregations":[]}}',
    VALID_SQL_QUERY:
        '{"context":{"dataSource":"telemetry-events"},"query":"SELECT * FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2020-12-31\' AND __time < TIMESTAMP \'2021-01-21\' LIMIT 10"}',
    HIGH_LIMIT_SQL_QUERY:
        '{"context":{"dataSource":"telemetry-events"},"querySql":{"query":"SELECT mid FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-01-22\' LIMIT 100000"}}',
    HIGH_DATE_RANGE_SQL_QUERY:
        '{"context":{"dataSource":"telemetry-events"},"query":"SELECT actor_type, content_status FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-02-12\' LIMIT 10"}',
    LIMIT_IS_NAN:
        '{"context":{"dataSource":"telemetry-events"},"query":"SELECT content_status FROM \\"telemetry-events\\" WHERE __time >= TIMESTAMP \'2021-01-01\' AND __time < TIMESTAMP \'2021-01-12\' LIMIT \\"100\\""}',
    DATASOURCE_NOT_FOUND: '{"context":{"dataSource":"telemetry"},"query":"SELECT content_status FROM \\"telemetry\\" LIMIT 5"}',
}