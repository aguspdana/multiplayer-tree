"use client";

import React from "react";
import { Element, Path } from "doc";
import {
  NodeComponentProps,
  RootTree,
  Selection,
} from "lib/components/Tree";

interface TreeMapProps {
  tree: Element[],
  insertElement: (path: Path, elm: Element) => void,
  deleteElement: (path: Path) => void,
  deleteSelected: () => void,
  moveElement: (from: Path, to: Path) => void,
  moveSelected: (to: Path) => void,
  selection: Selection,
  setSelection: (selection: Selection) => void
}

export function TreeMap(props: TreeMapProps) {
  const {
    tree,
    insertElement,
    deleteElement,
    deleteSelected,
    moveElement,
    moveSelected,
    selection,
    setSelection,
  } = props;

  return (
    <RootTree
      tree={tree}
      insertNode={insertElement}
      deleteNode={deleteElement}
      deleteSelected={deleteSelected}
      moveNode={moveElement}
      moveSelected={moveSelected}
      // eslint-disable-next-line react/no-children-prop
      component={NodeComponent}
      selection={selection}
      setSelection={setSelection}
    />
  );
}

function NodeComponent(props: NodeComponentProps<Element>) {
  const { node } = props;

  function up(e: React.MouseEvent) {
    e.stopPropagation();
    props.moveUp(props.path);
  }

  function down(e: React.MouseEvent) {
    e.stopPropagation();
    props.moveDown(props.path);
  }

  function deleteElm(e: React.MouseEvent) {
    e.stopPropagation();
    props.deleteNode(props.path);
  }

  return (
    <div>
      {node.name}
      <button onClick={up}>move up</button>
      <button onClick={down}>move down</button>
      <button onClick={deleteElm}>delete</button>
    </div>
  );
}
