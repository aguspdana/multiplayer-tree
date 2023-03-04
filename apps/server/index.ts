import { Server } from "socket.io";
import { Doc } from "doc";

interface ServerDoc extends Doc {
  version: number,
  operations: any[],
  clients: {
    [id: string]: {
      transactions: {
        version: number,
        transformed: Transaction[],
      }[]
    }
  }
}

interface DocsMap {
  [id: string]: ServerDoc
}

interface ClientsMap {
  [id: string]: {
    docs: string[],
    msgCount: number,
    socketIds: string[]
  }
}

interface SocketsMap {
  [id: string]: {
    clientId: string,
    socket: any
  }
}

// When a client is connected.
// - Add add the socket id to the sockets map.
// - Add it to the clients map.
//
// When a client is disconnected.
// - Remove the socket from sockets map.
// - Remove the socket from clients map socket list.
//
// If a client has no socket for # seconds,
// - Remove it from the clients map.
// - Remove it from the subscribed docs.

type Transaction = Operation[];
type Operation = any;

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

io.to("").emit("");

io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("doc_list", () => {});
  socket.on("subscribe", () => {});
  socket.on("unsubscribe", () => {});
  socket.on("apply", () => {});

  // - Client requests available pages/components
  // - Client ubscribes to a page/component
  //   - Server sends the latest version
  // - Client creates a new page/component
  // - Client deletes a page/component
  //   - Server broadcasts a delete-page-component event
  // - Client sends transaction
  // - Server broadcasts transaction
  // - Client unsibscribes to a page/component
});
