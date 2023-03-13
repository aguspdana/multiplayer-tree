import { Doc, Operation } from "doc";
export interface ServerToClientEvents {
    clientId: (id: string) => void;
    docList: (list: Pick<Doc, "id" | "title" | "type">[]) => void;
    subscribed: (props: {
        version: number;
        doc: Doc;
    }) => void;
    unsyncable: (props: {
        id: string;
    }) => void;
    docCreated: (props: {
        id: string;
    }) => void;
    docDeleted: (props: {
        id: string;
    }) => void;
    applied: (props: {
        id: string;
        version: number;
    }) => void;
    apply: (props: {
        id: string;
        version: number;
        operations: Operation[];
    }) => void;
}
export interface ClientToServerEvents {
    listDocs: () => void;
    subscribe: (props: {
        id: string;
    }) => void;
    unsubscribe: (props: {
        id: string;
    }) => void;
    createDoc: (doc: Omit<Doc, "id">) => void;
    deleteDoc: (props: {
        id: string;
    }) => void;
    renameDoc: (props: {
        id: string;
        title: string;
    }) => void;
    apply: (props: {
        id: string;
        version: number;
        operations: Operation[];
    }) => void;
}
export interface InterServerEvents {
}
export interface SocketData {
    clientId: string;
}
