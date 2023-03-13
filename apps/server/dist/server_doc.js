"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerDoc = exports.DocsMap = void 0;
const doc_1 = require("doc");
class DocsMap {
    docs;
    constructor() {
        this.docs = {};
    }
    add(doc) {
        this.docs[doc.id] = doc;
    }
    delete(id) {
        delete this.docs[id];
    }
    get(id) {
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
exports.DocsMap = DocsMap;
class ServerDoc {
    _id;
    _type;
    _title;
    _children;
    _version;
    _operations;
    constructor(doc) {
        this._id = doc.id;
        this._type = doc.type;
        this._title = doc.title;
        this._children = doc.children;
        this._version = 0;
        // old to new
        this._operations = [];
    }
    apply(version, ops) {
        if (version > this._version || version < this._version - this._operations.length) {
            return null;
        }
        const baseIndex = this._operations.length - (this._version - version);
        const rebased = (0, doc_1.cleanRebase)(ops, this._operations.slice(baseIndex));
        let children = this._children;
        const appliedOps = [];
        for (const op of rebased) {
            const res = (0, doc_1.applyOperation)(children, op);
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
exports.ServerDoc = ServerDoc;
