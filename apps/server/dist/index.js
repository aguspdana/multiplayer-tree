"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const client_1 = require("./client");
const server_doc_1 = require("./server_doc");
const docs_1 = require("./docs");
const docsMap = new server_doc_1.DocsMap();
const clientsMap = new client_1.ClientsMap();
docs_1.docs.forEach(doc => {
    docsMap.add(new server_doc_1.ServerDoc(doc));
});
const io = new socket_io_1.Server(3001, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});
io.use((socket, next) => {
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
    clientsMap.get(clientId)?.addSocketId(socket.id);
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
                socket.to(id).emit("apply", { ...tr, id: id });
            }
        }
    });
    socket.on("disconnecting", () => {
        const clientId = socket.data.clientId;
        if (clientId) {
            clientsMap.get(clientId)?.removeSocketId(socket.id);
        }
    });
});
