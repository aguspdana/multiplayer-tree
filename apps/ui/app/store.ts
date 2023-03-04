import { Doc, DocType, Operation } from "@/lib/ot";
import { create } from "zustand";

interface State {
  docs: {
    [id: string]: {
      doc: Doc,
      undo: Operation[][],
      sentTransactions: Operation[][],
    }
  },

  openDocId: string | null,

  applyTransaction: (tr: Operation[]) => void,
  applyRemoteTransaction: (tr: Operation[]) => void,
}

enum DocState {
  Live,
  Stale,
}

export const useStore = create<State>((set): State => {
  return {
    docs: {
      abc: {
        doc: {
          id: "abc",
          type: DocType.Page,
          title: "Hello",
          content: [],
        },
        undo: [],
        sentTransactions: []
      }
    },

    openDocId: "abc",

    applyTransaction: function (tr) {},

    applyRemoteTransaction: function (tr) {},
  };
});
