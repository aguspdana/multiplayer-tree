import BormClient, { BormConfig, BormSchema } from "@blitznocode/blitz-orm";
export declare function init(schema: BormSchema, config: BormConfig, schemaPath: string, dataPath: string): Promise<{
    client: BormClient;
    dbName: string;
}>;
export declare function cleanup(url: string, dbName: string): Promise<void>;
