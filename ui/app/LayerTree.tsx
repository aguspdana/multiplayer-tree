"use client";

import { useState } from "react";
import {
  NodeComponentProps,
  RootTree,
  Selection,
  } from "./Tree";
import styles from "./LayerTree.module.css";

interface Layer {
  id: string,
  text: string,
  children: Layer[]
}

const items: Layer[] = [
  {
    id: "a",
    text: "Hello A",
    children: [
      {
        id: "a.a",
        text: "Hello AA",
        children: []
      },
      {
        id: "a.b",
        text: "Hello AB",
        children: []
      }
    ]
  },
  {
    id: "b",
    text: "Hello B",
    children: []
  },
  {
    id: "c",
    text: "Hello C",
    children: []
  }
];

export function LayerTree() {
  const [tree, setTree] = useState(items);
  const [selection, setSelection] = useState<Selection>({});

  return (
    <RootTree
      tree={tree}
      setTree={setTree}
      // eslint-disable-next-line react/no-children-prop
      component={NodeComponent}
      selection={selection}
      setSelection={setSelection}
    />
  );
}

function NodeComponent({
  deleteNode,
  insertNode,
  moveUp,
  moveDown,
  moveToParent,
  moveToPrevSibling,
  unwrap,
  node,
  path
}: NodeComponentProps<Layer>) {
  function insertLastChild() {
    const newNode: Layer = {
      id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
      text: "New layer",
      children: []
    };
    insertNode([...path, node.children.length], newNode);
  }

  return (
    <div className={styles.node}>
      <span>{path.join("/")}: {node.text}</span>

      <button
        onClick={() => moveToParent(path)}
        onMouseDown={e => e.stopPropagation()}
      >
        left
      </button>

      <button
        onClick={() => moveToPrevSibling(path)}
        onMouseDown={e => e.stopPropagation()}
      >
        right
      </button>

      <button
        onClick={() => moveUp(path)}
        onMouseDown={e => e.stopPropagation()}
      >
        up
      </button>

      <button
        onClick={() => moveDown(path)}
        onMouseDown={e => e.stopPropagation()}
      >
        down
      </button>

      <button
        onClick={() => unwrap(path)}
        onMouseDown={e => e.stopPropagation()}
      >
        unwrap
      </button>

      <button
        onClick={insertLastChild}
        onMouseDown={e => e.stopPropagation()}
      >
        insert
      </button>

      <button
        onClick={() => deleteNode(path)}
        onMouseDown={e => e.stopPropagation()}
      >
        delete
      </button>
    </div>
  );
}
