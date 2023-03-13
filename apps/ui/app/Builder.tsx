"use client";

import { useEffect } from "react";
import { TreeMap } from "./TreeMap";
import { useStore } from "./store";
import { Document } from "./Document";
import styles from "./Builder.module.css";

export function Builder() {
  const id = "page-1";
  const openDoc = useStore(state => state.openDoc);
  const doc = useStore(state => state.docs[id]?.doc);
  const insertElement = useStore(state => state.insertElement);
  const deleteElement = useStore(state => state.deleteElement);
  const deleteSelected = useStore(state => state.deleteSelected);
  const moveElement = useStore(state => state.moveElement);
  const moveUp = useStore(styles => styles.moveUp);
  const moveDown = useStore(styles => styles.moveDown);
  const moveSelected = useStore(state => state.moveSelected);
  const selection = useStore(state => state.docs[id]?.selection);
  const setSelection = useStore(state => state.setSelection);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);

  console.log("selection", selection);

  useEffect(() => {
    openDoc(id);
  }, [openDoc]);

  if (doc && selection) {
    return (
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <TreeMap
            tree={doc.children}
            insertElement={insertElement}
            deleteElement={deleteElement}
            deleteSelected={deleteSelected}
            moveElement={moveElement}
            moveUp={moveUp}
            moveDown={moveDown}
            moveSelected={moveSelected}
            selection={selection}
            setSelection={setSelection}
          />
        </div>
        <Document
          doc={doc}
          selection={selection}
          editable={true}
        />
      </div>
    );
  }

  return null;
}

