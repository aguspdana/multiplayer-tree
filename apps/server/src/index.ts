import { Server } from "socket.io";
import { ClientsMap } from "./client";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./messages";
import { DocsMap, ServerDoc } from "./server_doc";
import { docs } from "./docs";

const docsMap = new DocsMap();
const clientsMap = new ClientsMap();

docs.forEach(doc => {
  docsMap.add(new ServerDoc(doc));
});

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(3001, {
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
  } else {
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
