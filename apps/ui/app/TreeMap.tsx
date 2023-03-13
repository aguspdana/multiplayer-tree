"use client";

import React from "react";
import { ButtonElement, Element, ElementType, InputElement, LayoutDirection, LayoutElement, Path, TextElement } from "doc";
import {
  NodeComponentProps,
  RootTree,
  Selection,
} from "lib/components/Tree";
import styles from "./TreeMap.module.css";

interface TreeMapProps {
  tree: Element[],
  insertElement: (path: Path, elm: Element) => void,
  deleteElement: (path: Path) => void,
  deleteSelected: () => void,
  moveElement: (from: Path, to: Path) => void,
  moveUp: (at: Path) => void,
  moveDown: (at: Path) => void,
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
    moveUp,
    moveDown,
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
      moveUp={moveUp}
      moveDown={moveDown}
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

  function insertText(e: React.MouseEvent) {
    const path = [...props.path, 0];
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    const element: TextElement = {
      id,
      type: ElementType.Text,
      name: "Text " + id,
      text: "Hello Text " + id,
      fontSize: 16,
    };
    props.insertNode(path, element);
  }

  function insertInput(e: React.MouseEvent) {
    const path = [...props.path, 0];
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    const element: InputElement = {
      id,
      type: ElementType.Input,
      name: "Input " + id,
      placeholder: "Type here",
    };
    props.insertNode(path, element);
  }

  function insertButton(e: React.MouseEvent) {
    const path = [...props.path, 0];
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    const element: ButtonElement = {
      id,
      type: ElementType.Button,
      name: "Button " + id,
      text: "Click " + id,
    };
    props.insertNode(path, element);
  }

  function insertColumnLayout(e: React.MouseEvent) {
    const path = [...props.path, 0];
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    const element: LayoutElement = {
      id,
      type: ElementType.Layout,
      name: "Layout " + id,
      direction: LayoutDirection.Column,
      children: [],
    };
    props.insertNode(path, element);
  }

  function insertRowLayout(e: React.MouseEvent) {
    const path = [...props.path, 0];
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    const element: LayoutElement = {
      id,
      type: ElementType.Layout,
      name: "Layout " + id,
      direction: LayoutDirection.Row,
      children: [],
    };
    props.insertNode(path, element);
  }

  return (
    <div className={styles.node}>
      {node.name}
      <button onClick={up}>Move Up</button>
      <button onClick={down}>Move Down</button>
      <button onClick={deleteElm}>Delete</button>
      {props.node.type === ElementType.Layout && (
        <>
          <button onClick={insertColumnLayout}>Insert Column Layout</button>
          <button onClick={insertRowLayout}>Insert Row Layout</button>
          <button onClick={insertText}>Insert Text</button>
          <button onClick={insertInput}>Insert Input</button>
          <button onClick={insertButton}>Insert Button</button>
        </>
      )}
    </div>
  );
}
