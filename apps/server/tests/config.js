"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    server: {
        provider: "blitz-orm-js",
    },
    dbConnectors: [
        {
            id: "default",
            provider: "typeDB",
            dbName: "tree",
            url: "localhost:1729",
        },
    ],
};
