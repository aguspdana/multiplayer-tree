import { Doc, DocType, Element, Operation } from "doc";
export declare class DocsMap {
    private docs;
    constructor();
    add(doc: ServerDoc): void;
    delete(id: string): void;
    get(id: string): ServerDoc | undefined;
    get list(): {
        id: string;
        type: DocType;
        title: string;
    }[];
}
export declare class ServerDoc {
    private _id;
    private _type;
    private _title;
    private _children;
    private _version;
    private _operations;
    constructor(doc: Doc);
    apply(version: number, ops: Operation[]): VersionedTransaction | null;
    get data(): {
        id: string;
        type: DocType;
        title: string;
        children: Element[];
    };
    get id(): string;
    get version(): number;
}
export interface VersionedTransaction {
    version: number;
    operations: Operation[];
}
