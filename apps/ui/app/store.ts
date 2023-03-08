import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import {
  applyOperation,
  cleanRebase,
  DeleteOperation,
  Doc,
  Element,
  InsertOperation,
  MoveOperation,
  Operation,
  OperationType,
  Path,
  PathType,
  rebase,
  transformPathAfterOperation,
} from "doc";
import { pathsToSelection, Selection, selectionToPaths } from "lib/components/Tree";

interface State {
  docsList: {
    id: string,
    title: string,
  }[],
  docs: {
    [id: string]: {
      doc: Doc,
      selection: Selection,
      version: number,
      undo: Operation[][],
      redo: Operation[][],
      sentOperations: Operation[],
      undoSentOperations: Operation[],
      pendingOperations: Operation[],
      undoPendingOperations: Operation[],
    }
  },
  openDocId: string | null,

  openDoc: (id: string) => void,
  applyOperations: (ops: Operation[]) => void,
  undo: () => void,
  redo: () => void,
  setSelection: (selection: Selection) => void,
  insertElement: (at: Path, element: Element) => void,
  deleteElement: (at: Path) => void,
  moveElement: (from: Path, to: Path) => void,
  moveSelected: (to: Path) => void,
  deleteSelected: () => void,
}

export interface ServerToClientEvents {
  clientId: (id: string) => void,
  docList: (list: Pick<Doc, "id" | "title" | "type">[]) => void,
  subscribed: (props: { doc: Doc, version: number }) => void,
  unsyncable: (props: { id: string }) => void,
  docCreated: (props: { id: string }) => void,
  docDeleted: (props: { id: string }) => void,
  applied: (props: { id: string, version: number }) => void,
  apply: (props: { id: string, version: number, operations: Operation[] }) => void,
}

export interface ClientToServerEvents {
  listDocs: () => void,
  subscribe: (props: { id: string }) => void,
  unsubscribe: (props: { id: string }) => void,
  createDoc: (doc: Omit<Doc, "id">) => void,
  deleteDoc: (props: { id: string }) => void,
  renameDoc: (props: { id: string, title: string }) => void,
  apply: (props: { id: string, version: number, operations: Operation[] }) => void,
}

export const useStore = create<State>((set, get): State => {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("ws://localhost:3001");

  socket.on("clientId", (id) => {
    socket.auth = { id };
  });

  socket.on("docList", (docsList) => {
    set(state => ({
      ...state,
      docsList
    }));
  });

  socket.on("docCreated", ({}) => {
    // TODO
  });

  socket.on("docDeleted", ({}) => {
    // TODO
  });

  socket.on("subscribed", ({ doc, version }) => {
    set(state => ({
      ...state,
      docs: {
        ...state.docs,
        [doc.id]: {
          doc,
          selection: [],
          version,
          undo: [],
          redo: [],
          sentOperations: [],
          undoSentOperations: [],
          pendingOperations: [],
          undoPendingOperations: [],
        }
      }
    }));
  });

  socket.on("applied", ({ id, version }) => {
    set(state => {
      if (!state.docs[id]) {
        return state;
      }

      const newState = {
        ...state,
        docs: {
          ...state.docs,
          [id]: {
            ...state.docs[id],
            version
          }
        }
      };

      const doc = newState.docs[id];

      doc.sentOperations = [];
      doc.undoSentOperations = [];

      if (doc.pendingOperations.length > 0) {
        doc.sentOperations = doc.pendingOperations;
        doc.undoSentOperations = doc.undoPendingOperations;
        doc.version = version;
        doc.pendingOperations = [];
        doc.undoPendingOperations = [];

        socket.emit("apply", {
          id,
          version: doc.version,
          operations: doc.sentOperations,
        });
      }

      return newState;
    });
  });

  socket.on("apply", ({ id, version: _, operations }) => {
    set(state => {
      if (!state.docs[id]) {
        return state;
      }

      const doc = { ...state.docs[id] };

      const uncommitedOps = [...doc.sentOperations, ...doc.pendingOperations];
      const rebasedUncommited = rebase(uncommitedOps, operations);

      const rebasedSentOperations: Operation[] = [];
      for (let i = 0; i < doc.sentOperations.length; i++) {
        const op = rebasedUncommited[i];
        if (op) {
          rebasedSentOperations.push(op);
        }
      }

      const rebasedPendingOperations: Operation[] = [];
      for (let i = doc.sentOperations.length; i < rebasedUncommited.length; i++) {
        const op = rebasedUncommited[i];
        if (op) {
          rebasedPendingOperations.push(op);
        }
      }

      const undoRedoBase = [
        ...doc.undoSentOperations,
        ...doc.undoPendingOperations,
        ...operations,
        ...rebasedSentOperations,
        ...rebasedPendingOperations,
      ]
      const rebasedUndo = rebaseTransactions(doc.undo, undoRedoBase);
      const rebasedRedo = rebaseTransactions(doc.redo, undoRedoBase);

      const undoUncommitedOps: Operation[] = [];
      forEachReverse(doc.undoPendingOperations, (op) => {
        undoUncommitedOps.push(op);
      });
      forEachReverse(doc.undoSentOperations, (op) => {
        undoUncommitedOps.push(op);
      });
      let { children: children } = applyOperationsOnContent(doc.doc.children, undoUncommitedOps);

      children = applyOperationsOnContent(children, operations).children;

      const rebasedSentRes = applyOperationsOnContent(children, rebasedSentOperations);
      children = rebasedSentRes.children;
      const undoSentOperations = rebasedSentRes.undo;

      const rebasedPendingRes = applyOperationsOnContent(children, rebasedPendingOperations);
      children = rebasedPendingRes.children;
      const undoPendingOperations = rebasedPendingRes.undo;

      const newState: State = {
        ...state,
        docs: {
          ...state.docs,
          [id]: {
            ...doc,
            doc: {
              ...doc.doc,
              children,
            },
            undo: rebasedUndo,
            redo: rebasedRedo,
            sentOperations: rebasedSentOperations,
            undoSentOperations,
            pendingOperations: rebasedPendingOperations,
            undoPendingOperations,
          }
        }
      };

      return newState;
    });
  });

  socket.on("unsyncable", ({}) => {
    // TODO
  });

  function applyOperations(ops: Operation[]) {
    const sequenceOps: Operation[] = [];

    for (const op of ops) {
      let res = cleanRebase([op], sequenceOps);
      if (res.length > 0) {
        sequenceOps.push(res[0]);
      }
    }

    set(state => {
      if (typeof state.openDocId !== "string") {
        return state;
      }

      const doc = { ...state.docs[state.openDocId] };

      if (!doc) {
        return state;
      }

      // const rebasedUndo = rebaseTransactions(doc.undo, sequenceOps);

      const { children, undo } = applyOperationsOnContent(doc.doc.children, sequenceOps);

      doc.doc = {
        ...doc.doc,
        children,
      };
      // doc.undo = [...rebasedUndo, undo];
      doc.undo = [...doc.undo, undo];
      doc.redo = [];
      doc.selection = transformSelection(doc.selection, sequenceOps);

      // Send or buffer operations.
      if (doc.sentOperations.length === 0) {
        socket.emit("apply", {
          id: doc.doc.id,
          version: doc.version,
          operations: sequenceOps
        });
        doc.sentOperations = sequenceOps;
        doc.undoSentOperations = undo;
      } else {
        doc.pendingOperations = [...doc.pendingOperations, ...sequenceOps];
        doc.undoPendingOperations = [...doc.undoPendingOperations, ...undo];
      }

      const newState = {
        ...state,
        docs: {
          ...state.docs,
          [doc.doc.id]: doc
        }
      };

      return newState;
    });
  }

  return {
    docsList: [],
    docs: {},
    openDocId: null,

    openDoc: function (id: string) {
      socket.emit("subscribe", { id });
      set(state => ({
        ...state,
        openDocId: id
      }));
    },

    applyOperations,

    undo: function () {
      set(state => {
        const id = state.openDocId;
        if (!id) {
          return state;
        }

        const doc = { ...state.docs[id] };
        if (!doc) {
          return state;
        }

        if (doc.undo.length === 0) {
          return state;
        }

        const ops = doc.undo[doc.undo.length - 1];

        const { children, undo } = applyOperationsOnContent(doc.doc.children, ops);

        doc.doc = {
          ...doc.doc,
          children,
        };
        // doc.undo = rebaseTransactions(doc.undo.slice(0, -1), ops);
        doc.undo = doc.undo.slice(0, -1);
        doc.redo = [...doc.redo, undo];
        doc.selection = transformSelection(doc.selection, ops);

        // Send or buffer operations.
        if (doc.sentOperations.length === 0) {
          socket.emit("apply", {
            id: doc.doc.id,
            version: doc.version,
            operations: ops
          });
          doc.sentOperations = ops;
          doc.undoSentOperations = undo;
        } else {
          doc.pendingOperations = [...doc.pendingOperations, ...ops];
          doc.undoPendingOperations = [...doc.undoPendingOperations, ...undo];
        }

        const newState = {
          ...state,
          docs: {
            ...state.docs,
            [doc.doc.id]: doc
          }
        };

        return newState;
      });
    },

    redo: function () {
      set(state => {
        const id = state.openDocId;
        if (!id) {
          return state;
        }

        const doc = { ...state.docs[id] };
        if (!doc) {
          return state;
        }

        if (doc.redo.length === 0) {
          return state;
        }

        const ops = doc.redo[doc.redo.length - 1];

        const { children, undo } = applyOperationsOnContent(doc.doc.children, ops);
        // const rebasedUndo = rebaseTransactions(doc.undo, ops);
        // const rebasedRedo = rebaseTransactions(doc.redo.slice(0, -1), ops);

        doc.doc = {
          ...doc.doc,
          children,
        };
        // doc.undo = [...rebasedUndo, undo];
        doc.undo = [...doc.undo, undo];
        // doc.redo = rebasedRedo;
        doc.redo = doc.redo.slice(0, -1);
        doc.selection = transformSelection(doc.selection, ops);

        // Send or buffer operations.
        if (doc.sentOperations.length === 0) {
          socket.emit("apply", {
            id: doc.doc.id,
            version: doc.version,
            operations: ops
          });
          doc.sentOperations = ops;
          doc.undoSentOperations = undo;
        } else {
          doc.pendingOperations = [...doc.pendingOperations, ...ops];
          doc.undoPendingOperations = [...doc.undoPendingOperations, ...undo];
        }

        const newState = {
          ...state,
          docs: {
            ...state.docs,
            [doc.doc.id]: doc
          }
        };

        return newState;
      });
    },

    setSelection: function (selection) {
      set(state => {
        const id = state.openDocId;

        if (!id || !state.docs[id]) {
          return state;
        }

        return {
          ...state,
          docs: {
            ...state.docs,
            [id]: {
              ...state.docs[id],
              selection,
            }
          }
        };
      });
    },

    insertElement: function (path, element) {
      const op: InsertOperation = {
        type: OperationType.Insert,
        path,
        element,
      };
      applyOperations([op]);
    },

    deleteElement: function (path) {
      const op: DeleteOperation = {
        type: OperationType.Delete,
        path,
      };
      applyOperations([op]);
    },

    moveElement: function (from: Path, to: Path) {
      const op: MoveOperation = {
        type: OperationType.Move,
        from,
        to,
      };
      applyOperations([op]);
    },

    moveSelected: function (to: Path) {
      const state = get();
      if (!state.openDocId) {
        return;
      }
      const doc = state.docs[state.openDocId];
      if (!doc) {
        return;
      }
      const paths = selectionToPaths(doc.selection);
      const ops: MoveOperation[] = [];
      // Because the target position is an anchor, which stays the same after
      // a new item is inserted at that position, we have to move them from
      // last to first.
      for (let i = paths.length - 1; i >= 0; i--) {
        ops.push({
          type: OperationType.Move,
          from: paths[i],
          to,
        });
      }
      applyOperations(ops);
    },

    deleteSelected: function () {
      const state = get();
      if (!state.openDocId) {
        return;
      }
      const doc = state.docs[state.openDocId];
      if (!doc) {
        return;
      }
      const paths = selectionToPaths(doc.selection);
      const ops: DeleteOperation[] = [];
      // Because the target position is an anchor, which stays the same after
      // a new item is inserted at that position, we have to move them from
      // last to first.
      for (let i = paths.length - 1; i >= 0; i--) {
        ops.push({
          type: OperationType.Delete,
          path: paths[i],
        });
      }
      applyOperations(ops);
    },
  };
});

// Rebase transactions without transforming backward against previous transactions.
function rebaseTransactions(trs: Operation[][], base: Operation[]) {
  const rebasedTransactions: Operation[][] = [];
  for (const ops of trs) {
    rebasedTransactions.push(cleanRebase(ops, base));
  }
  return rebasedTransactions;
}

function applyOperationsOnContent(children: Element[], ops: Operation[]) {
  let newChildren = children;
  let undo: Operation[] = [];

  for (const op of ops) {
    const res = applyOperation(newChildren, op);
    if (res) {
      newChildren = res.tree;
      undo = cleanRebase(undo, [op]);
      undo.push(res.undo);
    }
  }

  return {
    children: newChildren,
    undo,
  };
}

function transformSelection(selection: Selection, ops: Operation[]) {
  const paths = selectionToPaths(selection);
  const transformedPaths: Path[] = [];
  path: for (let path of paths) {
    for (const op of ops) {
      let res = transformPathAfterOperation(path, PathType.Exact, op);
      if (!res) {
        continue path;
      }
      path = res;
    }
    transformedPaths.push(path);
  }
  const transformedSelection = pathsToSelection(transformedPaths);
  return transformedSelection;
}

function forEachReverse<T>(array: T[], cb: (item: T, index: number) => void) {
  for (let i = array.length - 1; i >= 0; i--) {
    cb(array[i], i);
  }
}
