import { Doc, Element, DocType, Transaction, Operation } from "doc";
import { Queue } from "./queue";

export class ServerDoc {
  private id: string;
  private type: DocType;
  private title: string;
  private content: Element[];
  private version: number;
  private operations: Operation[];
  private clients: {
    [id: string]: {
      transactions: {
        version: number,
        transformed: Transaction[],
      }[]
    }
  };
  private queue: Queue<ClientTransaction>;
  private broadcast: BroadcastFn;

  constructor(doc: Doc, broadcast: BroadcastFn ) {
    this.id = doc.id;
    this.type = doc.type;
    this.title = doc.title;
    this.content = doc.content;
    this.version = 0;
    this.operations = [];
    this.clients = {};
    this.broadcast = broadcast;
    this.queue = new Queue(this._apply);
  }

  apply(tr: ClientTransaction) {
    this.queue.addJob(tr);
  }

  private _apply(tr: ClientTransaction) {
    // TODO
  }

  addClient(id: string) {
    this.clients[id] = {
      transactions: []
    };
  }

  removeClient(id: string) {
    delete this.clients[id];
  }
}

type BroadcastFn = (job: RemoteTransaction) => void;

interface RemoteTransaction {
  version: number,
  transaction: Transaction
}

interface ClientTransaction extends RemoteTransaction {
  clientId: string
}
