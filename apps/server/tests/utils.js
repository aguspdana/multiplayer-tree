"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.init = void 0;
const fs_1 = require("fs");
const typedb_client_1 = require("typedb-client");
const uuid_1 = require("uuid");
const blitz_orm_1 = __importDefault(require("@blitznocode/blitz-orm"));
async function init(schema, config, schemaPath, dataPath) {
    const [connector] = config.dbConnectors;
    const tqlSchema = (0, fs_1.readFileSync)(schemaPath, "utf8");
    const tqlData = (0, fs_1.readFileSync)(dataPath, "utf8");
    const dbName = `${connector.dbName}_${(0, uuid_1.v4)()}`;
    const client = typedb_client_1.TypeDB.coreClient(connector.url);
    await client.databases.create(dbName);
    const schemaSession = await client.session(dbName, typedb_client_1.SessionType.SCHEMA);
    const dataSession = await client.session(dbName, typedb_client_1.SessionType.DATA);
    const schemaTransaction = await schemaSession.transaction(typedb_client_1.TransactionType.WRITE);
    await schemaTransaction.query.define(tqlSchema);
    await schemaTransaction.commit();
    await schemaTransaction.close();
    await schemaSession.close();
    const dataTransaction = await dataSession.transaction(typedb_client_1.TransactionType.WRITE);
    dataTransaction.query.insert(tqlData);
    await dataTransaction.commit();
    await dataTransaction.close();
    await dataSession.close();
    await client.close();
    const bormClient = new blitz_orm_1.default({
        schema,
        config: {
            ...config,
            dbConnectors: [{ ...connector, dbName }]
        },
    });
    await bormClient.init();
    return { client: bormClient, dbName };
}
exports.init = init;
;
async function cleanup(url, dbName) {
    const client = typedb_client_1.TypeDB.coreClient(url);
    const db = await client.databases.get(dbName);
    await db.delete();
    await client.close();
}
exports.cleanup = cleanup;
;
