"use client";

import { useEffect } from "react";
import { TreeMap } from "./TreeMap";
import { useStore } from "./store";
import { Document } from "./Document";
import styles from "./Builder.module.css";

export function Builder() {
  const id = "0";
  const openDoc = useStore(state => state.openDoc);
  const tree = useStore(state => state.docs[id]?.doc.children);
  const insertElement = useStore(state => state.insertElement);
  const deleteElement = useStore(state => state.deleteElement);
  const deleteSelected = useStore(state => state.deleteSelected);
  const moveElement = useStore(state => state.moveElement);
  const moveSelected = useStore(state => state.moveSelected);
  const selection = useStore(state => state.docs[id]?.selection);
  const setSelection = useStore(state => state.setSelection);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const doc = useStore(state => state.openDocId && state.docs[state.openDocId]);

  useEffect(() => {
    console.log(doc);
  }, [doc]);

  useEffect(() => {
    openDoc(id);
  }, [openDoc]);

  if (tree && selection) {
    return (
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <TreeMap
            tree={tree}
            insertElement={insertElement}
            deleteElement={deleteElement}
            deleteSelected={deleteSelected}
            moveElement={moveElement}
            moveSelected={moveSelected}
            selection={selection}
            setSelection={setSelection}
          />
        </div>
        <Document/>
      </div>
    );
  }

  return null;
}

