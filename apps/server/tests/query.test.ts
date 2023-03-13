import "jest";
import {
  afterAll,
  beforeAll,
  describe,
  it
} from "@jest/globals"
import BormClient from "@blitznocode/blitz-orm";
import {
  cleanup,
  init,
} from "./utils";
import { schema } from "./schema";
import { config } from "./config";

describe("Query", () => {
  let dbName: string;
  let client: BormClient;

  beforeAll(async () => {
    const {
      client: _client,
      dbName: _dbName,
    } = await init(
      schema,
      config,
      "./tests/schema.tql",
      "./tests/data.tql"
    );
    client = _client;
    dbName = _dbName;
  }, 30000);

  afterAll(async () => {
    await cleanup(config.dbConnectors[0].url, dbName);
  });

  it("Query children of page-1", async () => {
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

  it("Query children layout-2", async () => {
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

  it("Query elm-compref-1", async () => {
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
