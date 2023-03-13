"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const globals_1 = require("@jest/globals");
const utils_1 = require("./utils");
const schema_1 = require("./schema");
const config_1 = require("./config");
(0, globals_1.describe)("Query", () => {
    let dbName;
    let client;
    (0, globals_1.beforeAll)(async () => {
        const { client: _client, dbName: _dbName, } = await (0, utils_1.init)(schema_1.schema, config_1.config, "./tests/schema.tql", "./tests/data.tql");
        client = _client;
        dbName = _dbName;
    }, 30000);
    (0, globals_1.afterAll)(async () => {
        await (0, utils_1.cleanup)(config_1.config.dbConnectors[0].url, dbName);
    });
    (0, globals_1.it)("Query children of page-1", async () => {
        const res = await client.query({
            $entity: "Doc",
            $id: "page-1",
            $fields: [
                "id",
                "title",
                { $path: "children" }
            ],
        });
        console.log(JSON.stringify(res, null, 2));
    });
    (0, globals_1.it)("Query children layout-2", async () => {
        const res = await client.query({
            $entity: "Parent",
            $id: "layout-2",
            $fields: [
                "id",
                { $path: "children" }
            ],
        });
        console.log(JSON.stringify(res, null, 2));
    });
    (0, globals_1.it)("Query elm-compref-1", async () => {
        const res = await client.query({
            $entity: "ComponentRefElement",
            $id: "comp-ref-1",
            $fields: [
                "id",
                { $path: "component" }
            ],
        });
        console.log(JSON.stringify(res, null, 2));
    });
});
