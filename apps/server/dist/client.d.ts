export declare class ClientsMap {
    private clients;
    private _onDelete?;
    constructor(onDelete?: (client: Client) => void);
    add(id: string): void;
    delete(id: string): void;
    get(id: string): Client | undefined;
}
export declare class Client {
    private _id;
    private _msgCount;
    private _socketIds;
    private _heartbeat;
    private _onMaxIdle;
    constructor(id: string, onMaxIdle: () => void);
    private _checkHeartBeat;
    get id(): string;
    get msgCount(): number;
    incrementMsgCount(): void;
    addSocketId(id: string): void;
    removeSocketId(id: string): void;
}
