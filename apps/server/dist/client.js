"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.ClientsMap = void 0;
const MAX_IDLE = 60000;
const HEARBEAT_INTERVAL = 10000;
class ClientsMap {
    constructor(onDelete) {
        this.clients = {};
        this._onDelete = onDelete;
    }
    add(id) {
        if (!this.clients[id]) {
            this.clients[id] = new Client(id, () => {
                this.delete(id);
            });
        }
    }
    delete(id) {
        const client = this.clients[id];
        delete this.clients[id];
        if (client && typeof this._onDelete === "function") {
            this._onDelete(client);
        }
    }
    get(id) {
        return this.clients[id];
    }
}
exports.ClientsMap = ClientsMap;
class Client {
    constructor(id, onMaxIdle) {
        this._id = id;
        this._onMaxIdle = onMaxIdle;
        this._msgCount = 0;
        this._socketIds = new Set();
        this._heartbeat = Date.now();
        setInterval(this._checkHeartBeat.bind(this), HEARBEAT_INTERVAL);
    }
    _checkHeartBeat() {
        if (this._socketIds.size > 0) {
            this._heartbeat = Date.now();
        }
        else if (Date.now() - this._heartbeat > MAX_IDLE) {
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
    addSocketId(id) {
        this._socketIds.add(id);
    }
    removeSocketId(id) {
        this._socketIds.delete(id);
    }
}
exports.Client = Client;
