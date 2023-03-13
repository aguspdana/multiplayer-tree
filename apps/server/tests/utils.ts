import { readFileSync } from "fs";
import {
  SessionType,
  TransactionType,
  TypeDB
} from "typedb-client";
import { v4 as uuidv4 } from "uuid";
import BormClient, {
  BormConfig,
  BormSchema,
} from "@blitznocode/blitz-orm";

export async function init(
  schema: BormSchema,
  config: BormConfig,
  schemaPath: string,
  dataPath: string,
) {
  const [connector] = config.dbConnectors;
  const tqlSchema = readFileSync(schemaPath, "utf8");
  const tqlData = readFileSync(dataPath, "utf8");
  const dbName = `${connector.dbName}_${uuidv4()}`;
  const client = TypeDB.coreClient(connector.url);
  await client.databases.create(dbName);

  const schemaSession = await client.session(dbName, SessionType.SCHEMA);
  const dataSession = await client.session(dbName, SessionType.DATA);
  const schemaTransaction = await schemaSession.transaction(TransactionType.WRITE);

  await schemaTransaction.query.define(tqlSchema);
  await schemaTransaction.commit();
  await schemaTransaction.close();
  await schemaSession.close();
  const dataTransaction = await dataSession.transaction(TransactionType.WRITE);
  dataTransaction.query.insert(tqlData);
  await dataTransaction.commit();
  await dataTransaction.close();
  await dataSession.close();
  await client.close();

  const bormClient = new BormClient({
    schema,
    config: {
      ...config,
      dbConnectors: [{ ...connector, dbName }]
    },
  });
  await bormClient.init();

  return { client: bormClient, dbName };
};

export async function cleanup(url: string, dbName: string) {
  const client = TypeDB.coreClient(url);
  const db = await client.databases.get(dbName);
  await db.delete();
  await client.close();
};
