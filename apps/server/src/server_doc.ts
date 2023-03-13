import {
  applyOperation,
  cleanRebase,
  Doc,
  DocType,
  Element,
  Operation,
} from "doc";

export class DocsMap {
  private docs: Record<string, ServerDoc>;

  constructor() {
    this.docs = {};
  }

  add(doc: ServerDoc) {
    this.docs[doc.id] = doc;
  }

  delete(id: string) {
    delete this.docs[id];
  }

  get(id: string): ServerDoc | undefined {
     return this.docs[id];
  }

  get list() {
    return Object.entries(this.docs)
      .map(([_, doc]) => {
        const { id, type, title } = doc.data;
        return { id, type, title };
      });
  }
}

export class ServerDoc {
  private _id: string;
  private _type: DocType;
  private _title: string;
  private _children: Element[];
  private _version: number;
  private _operations: Operation[];

  constructor(doc: Doc) {
    this._id = doc.id;
    this._type = doc.type;
    this._title = doc.title;
    this._children = doc.children;
    this._version = 0;
    // old to new
    this._operations = [];
  }

  apply(version: number, ops: Operation[]): VersionedTransaction | null {
    if (version > this._version || version < this._version - this._operations.length) {
      return null;
    }

    const baseIndex = this._operations.length - (this._version - version);
    const rebased = cleanRebase(ops, this._operations.slice(baseIndex));

    let children = this._children;

    const appliedOps: Operation[] = [];
    for (const op of rebased) {
      const res = applyOperation(children, op);
      if (!res) {
        continue;
      }
      children = res.tree;
      appliedOps.push(op);
    }

    this._children = children;
    this._version += appliedOps.length;
    for (const op of appliedOps) {
      this._operations.push(op);
    }

    return {
      version: this._version,
      operations: rebased,
    };
  }

  get data() {
    return {
      id: this._id,
      type: this._type,
      title: this._title,
      children: this._children,
    };
  }

  get id() {
    return this._id;
  }

  get version() {
    return this._version;
  }
}

export interface VersionedTransaction {
  version: number,
  operations: Operation[]
}
