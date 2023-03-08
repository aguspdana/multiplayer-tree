"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const client_1 = require("./client");
const server_doc_1 = require("./server_doc");
const doc_1 = require("doc");
const docsMap = new server_doc_1.DocsMap();
const clientsMap = new client_1.ClientsMap();
docsMap.add(new server_doc_1.ServerDoc({
    id: "0",
    type: doc_1.DocType.Page,
    title: "Example",
    children: [
        {
            id: "l1",
            type: doc_1.ElementType.Layout,
            name: "Layout 1",
            direction: doc_1.LayoutDirection.Column,
            children: [
                {
                    id: "l1.t1",
                    type: doc_1.ElementType.Text,
                    name: "Text L1 T1",
                    text: "Hello World",
                    fontSize: 16
                },
                {
                    id: "l1.t2",
                    type: doc_1.ElementType.Text,
                    name: "Text L1 T2",
                    text: "Hello World",
                    fontSize: 16
                },
                {
                    id: "l1.t3",
                    type: doc_1.ElementType.Text,
                    name: "Text L1 T3",
                    text: "Hello World",
                    fontSize: 16
                }
            ]
        },
        {
            id: "t1",
            type: doc_1.ElementType.Text,
            name: "Text 1",
            text: "Hello A",
            fontSize: 16
        },
        {
            id: "t2",
            type: doc_1.ElementType.Text,
            name: "Text 2",
            text: "Hello B",
            fontSize: 16
        },
        {
            id: "t3",
            type: doc_1.ElementType.Text,
            name: "Text 3",
            text: "Hello C",
            fontSize: 16
        }
    ]
}));
const io = new socket_io_1.Server(3001, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});
io.use((socket, next) => {
    var _a;
    // TODO: Authenticate client properly.
    let clientId = socket.handshake.auth.clientId;
    if (clientId) {
        socket.data.clientId = clientId;
    }
    else {
        clientId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
        socket.data.clientId = clientId;
    }
    clientsMap.add(clientId);
    (_a = clientsMap.get(clientId)) === null || _a === void 0 ? void 0 : _a.addSocketId(socket.id);
    next();
});
io.on("connection", (socket) => {
    if (socket.data.clientId) {
        socket.emit("clientId", socket.data.clientId);
    }
    socket.on("listDocs", () => {
        socket.emit("docList", docsMap.list);
    });
    socket.on("subscribe", ({ id }) => {
        const clientId = socket.data.clientId;
        const doc = docsMap.get(id);
        if (clientId && doc) {
            // TODO: If doc doesn't exist send error.
            const versionedDoc = {
                doc: doc.data,
                version: doc.version,
            };
            socket.emit("subscribed", versionedDoc);
            socket.join(id);
        }
    });
    socket.on("unsubscribe", ({ id }) => {
        socket.leave(id);
    });
    socket.on("apply", ({ id, version, operations }) => {
        const doc = docsMap.get(id);
        if (doc) {
            const tr = doc.apply(version, operations);
            if (tr) {
                socket.emit("applied", { id: id, version: tr.version });
                socket.to(id).emit("apply", Object.assign(Object.assign({}, tr), { id: id }));
            }
        }
    });
    socket.on("disconnecting", () => {
        var _a;
        const clientId = socket.data.clientId;
        if (clientId) {
            (_a = clientsMap.get(clientId)) === null || _a === void 0 ? void 0 : _a.removeSocketId(socket.id);
        }
    });
});
