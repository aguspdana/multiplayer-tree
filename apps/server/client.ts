const MAX_IDLE = 60_000;
const HEARBEAT_INTERVAL = 10_000;

export class Client {
  private docIds: Set<string>;
  private _msgCount: number;
  private socketIds: Set<string>;
  private heartbeat: number;
  private onMaxIdle: () => void;

  constructor(onMaxIdle: () => void) {
    this.onMaxIdle = onMaxIdle;
    this.docIds = new Set();
    this._msgCount = 0;
    this.socketIds = new Set();
    this.heartbeat = Date.now();

    setInterval(this.checkHeartBeat.bind(this), HEARBEAT_INTERVAL);
  }

  private checkHeartBeat() {
    if (this.socketIds.size > 0) {
      this.heartbeat = Date.now();
    } else if (Date.now() - this.heartbeat > MAX_IDLE) {
      this.onMaxIdle();
    }
  }

  get msgCount() {
    return this._msgCount;
  }

  incrementMsgCount() {
    this._msgCount += 1;
  }

  addSocketId(id: string) {
    this.socketIds.add(id);
  }

  removeSocketId(id: string) {
    this.socketIds.delete(id);
  }

  addDocId(id: string) {
    this.docIds.add(id);
  }

  removeDocId(id: string) {
    this.docIds.delete(id);
  }
}
