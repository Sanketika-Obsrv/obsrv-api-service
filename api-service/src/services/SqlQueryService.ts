import * as _ from "lodash";

// Collect every CTE-declared name anywhere in the AST. These are local aliases
// (WITH <name> AS ...), not datasources, so they must not be treated as tables.
export const collectCteNames = (node: any, acc: Set<string> = new Set()): Set<string> => {
    if (_.isArray(node)) {
        node.forEach((n) => collectCteNames(n, acc));
        return acc;
    }
    if (!_.isObject(node)) return acc;
    const withClause: any = _.get(node, "with");
    if (_.isArray(withClause)) {
        withClause.forEach((cte: any) => {
            const name = _.get(cte, "name.value") || _.get(cte, "name");
            if (_.isString(name)) acc.add(name);
        });
    }
    _.forEach(node, (value) => collectCteNames(value, acc));
    return acc;
};

// Recursively collect every FROM entry that references a real table name across
// the whole AST: FROM-clause tables at any depth, derived-table subqueries, plus
// tables inside CTE bodies, UNION/set-op branches, and WHERE/SELECT subqueries.
// CTE-declared names are skipped so they are not demanded as table params.
export const collectTableEntries = (node: any, cteNames: Set<string>, acc: any[] = []): any[] => {
    if (_.isArray(node)) {
        node.forEach((n) => collectTableEntries(n, cteNames, acc));
        return acc;
    }
    if (!_.isObject(node)) return acc;
    const fromArr = _.get(node, "from");
    if (_.isArray(fromArr)) {
        _.forEach(fromArr, (entry: any) => {
            const subquery = _.get(entry, "expr.ast");
            if (subquery) {
                collectTableEntries(subquery, cteNames, acc);
                return;
            }
            const table = _.get(entry, "table");
            if (_.isString(table) && !cteNames.has(table)) acc.push(entry);
        });
    }
    // Walk every other key (with/_next/where/columns/...) to reach nested selects,
    // but skip `from` to avoid re-visiting the entries handled above.
    _.forEach(node, (value, key) => {
        if (key !== "from") collectTableEntries(value, cteNames, acc);
    });
    return acc;
};
