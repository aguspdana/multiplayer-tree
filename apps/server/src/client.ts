const MAX_IDLE = 60_000;
const HEARBEAT_INTERVAL = 10_000;

export class ClientsMap {
  private clients: Record<string, Client>;
  private _onDelete?: (client: Client) => void;

  constructor(onDelete?: (client: Client) => void) {
    this.clients = {};
    this._onDelete = onDelete;
  }

  add(id: string) {
    if (!this.clients[id]) {
      this.clients[id] = new Client(id, () => {
        this.delete(id);
      });
    }
  }

  delete(id: string) {
    const client = this.clients[id];
    delete this.clients[id];
    if (client && typeof this._onDelete === "function") {
      this._onDelete(client);
    }
  }

  get(id: string): Client | undefined {
    return this.clients[id];
  }
}

export class Client {
  private _id: string;
  private _msgCount: number;
  private _socketIds: Set<string>;
  private _heartbeat: number;
  private _onMaxIdle: () => void;

  constructor(id: string, onMaxIdle: () => void) {
    this._id = id;
    this._onMaxIdle = onMaxIdle;
    this._msgCount = 0;
    this._socketIds = new Set();
    this._heartbeat = Date.now();

    setInterval(this._checkHeartBeat.bind(this), HEARBEAT_INTERVAL);
  }

  private _checkHeartBeat() {
    if (this._socketIds.size > 0) {
      this._heartbeat = Date.now();
    } else if (Date.now() - this._heartbeat > MAX_IDLE) {
      this._onMaxIdle();
    }
  }

  get id() {
    return this._id;
  }

  get msgCount() {
    return this._msgCount;
  }

  incrementMsgCount() {
    this._msgCount += 1;
  }

  addSocketId(id: string) {
    this._socketIds.add(id);
  }

  removeSocketId(id: string) {
    this._socketIds.delete(id);
  }
}
