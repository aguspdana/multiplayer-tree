import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import styles from "./Tree.module.css";

export type TreePath = number[];

export type Selection = { [index: number]: Selection };

/**
 * Undefined children means the node can't have children.
 */
export interface MinimalTreeNode<T extends MinimalTreeNode<T>> {
  id: string | number,
  children?: T[],
  folded?: boolean, // Ignored if children is undefined. Default to false.
}

export interface NodeComponentProps<T extends MinimalTreeNode<T>> {
  path: number[],
  tree: T[],
  insertNode: (at: TreePath, node: T) => void,
  deleteNode: (at: TreePath) => void,
  moveNode: (from: TreePath, to: TreePath) => void,
  moveUp: (path: TreePath) => void,
  moveDown: (path: TreePath) => void,
  moveToParent: (path: TreePath) => void,
  moveToPrevSibling: (path: TreePath) => void,
  unwrap: (path: TreePath) => void,
  node: T,
  fold: (at: TreePath) => void,
  unfold: (at: TreePath) => void,
}

export type NodeComponent<T extends MinimalTreeNode<T>> = (props: NodeComponentProps<T>) => ReactNode;

interface TreeProps<T extends MinimalTreeNode<T>> {
  path: TreePath,
  tree: T[],
  insertNode: (at: TreePath, node: T) => void,
  deleteNode: (at: TreePath) => void,
  moveNode: (from: TreePath, to: TreePath) => void,
  moveUp: (path: TreePath) => void,
  moveDown: (path: TreePath) => void,
  moveToParent: (path: TreePath) => void,
  moveToPrevSibling: (path: TreePath) => void,
  unwrap: (path: TreePath) => void,
  onDragStart: () => void,
  onDrop: () => void,
  setDropPath: (path: TreePath) => void,
  dropPath: TreePath | null,
  isDragged: boolean,
  fold: (at: TreePath) => void,
  unfold: (at: TreePath) => void,
  component: NodeComponent<T>,
  selection: Selection,
  select: (at: TreePath) => void,
  multiSelect: (at: TreePath) => void,
  selectRange: (at: TreePath) => void,
  unselect: (at: TreePath) => void,
}

interface TreeNodeProps<T extends MinimalTreeNode<T>> extends TreeProps<T> {
  node: T,
  dropspot: "above" | "below" | null
}

function TreeNode<T extends MinimalTreeNode<T>>({
  path,
  tree,
  insertNode,
  deleteNode,
  moveNode,
  moveUp,
  moveDown,
  moveToParent,
  moveToPrevSibling,
  unwrap,
  onDragStart,
  onDrop,
  setDropPath,
  dropPath,
  dropspot,
  isDragged,
  fold,
  unfold,
  node,
  component,
  select,
  multiSelect,
  selectRange,
  unselect,
  selection
}: TreeNodeProps<T>) {
  const [mouseDownAt, setMouseDownAt] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const selected = selection && Object.keys(selection).length == 0;

  let cotainerClass = styles.node_container;
  if (selected) {
    cotainerClass = cotainerClass + " " + styles.selected;
  }
  let contentClass = styles.node_content
  if (dropPath?.length === 1) {
    contentClass = contentClass + " " + styles.parent_dropspot;
  }

  function mouseDownOnContainer(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    setMouseDownAt({
      x: e.screenX,
      y: e.screenY
    });
    if (e.shiftKey) {
      selectRange(path);
    } else if (e.ctrlKey) {
      if (selected) {
        unselect(path);
      } else {
        multiSelect(path);
      }
    } else if (!selected) {
      select(path);
    }
  }

  function clickOnContainer(e: React.MouseEvent) {
    e.stopPropagation();
    if (!e.shiftKey && !e.ctrlKey) {
      select(path);
    }
  }

  function mouseEnterMoveOnContainer(e: React.MouseEvent<HTMLDivElement>) {
    if (isDragged && containerRef.current) {
      e.stopPropagation();
      const y = e.clientY - containerRef.current.offsetTop;
      const height = containerRef.current.offsetHeight;
      if (y < height / 2) {
          setDropPath([...path]);
      } else {
        const newDropPath = [...path];
        newDropPath[newDropPath.length - 1] += 1;
        setDropPath(newDropPath);
      }
    }
  }

  function handleMouseEnterMoveOnContent(e: React.MouseEvent<HTMLDivElement>) {
    if (isDragged && contentRef.current) {
      e.stopPropagation();
      const y = e.clientY - contentRef.current.offsetTop;
      const height = contentRef.current.offsetHeight;
      if (node.children?.length === 0) {
        if (y < height / 3) {
          setDropPath([...path]);
        } else if (y < height * 2 / 3) {
          const newDropPath = [...path, 0];
          setDropPath(newDropPath);
        } else {
          const newDropPath = [...path];
          newDropPath[newDropPath.length - 1] += 1;
          setDropPath(newDropPath);
        }
      } else if (y < height / 2) {
        setDropPath([...path]);
      } else if (node.children && node.children.length > 0) {
        const newDropPath = [...path, 0];
        setDropPath(newDropPath);
      } else {
        const newDropPath = [...path];
        newDropPath[newDropPath.length - 1] += 1;
        setDropPath(newDropPath);
      }
    }
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (mouseDownAt && !isDragged) {
        const dx = e.screenX - mouseDownAt.x;
        const dy = e.screenY - mouseDownAt.y;
        const threshold = 3;
        const shouldDrag = Math.abs(dx) > threshold || Math.abs(dy) > threshold;
        if (shouldDrag) {
          onDragStart();
        }
      }
    }

    if (mouseDownAt && !isDragged) {
      window.addEventListener("mousemove", handleMouseMove);

      return function() {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    }
  }, [mouseDownAt, isDragged, onDragStart, path]);

  useEffect(() => {
    function handleMouseUp() {
      setMouseDownAt(null);
    }

    window.addEventListener("mouseup", handleMouseUp);

    return function() {
      window.removeEventListener("mouseup", handleMouseUp);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cotainerClass}
      onClick={clickOnContainer}
      onMouseDown={mouseDownOnContainer}
      onMouseEnter={mouseEnterMoveOnContainer}
      onMouseMove={mouseEnterMoveOnContainer}
    >

      {dropspot === "above" && (
        <div className={styles.dropspot_wrapper}>
          <div className={styles.dropspot}/>
        </div>
      )}

      <div
        ref={contentRef}
        className={contentClass}
        onMouseEnter={handleMouseEnterMoveOnContent}
        onMouseMove={handleMouseEnterMoveOnContent}
      >
        {component({
          path,
          tree,
          insertNode,
          deleteNode,
          moveNode,
          moveUp,
          moveDown,
          moveToParent,
          moveToPrevSibling,
          unwrap,
          fold,
          unfold,
          node
        })}
      </div>

      {node.children instanceof Array && node.children.length > 0 && (
        <div className={styles.tree_wrapper}>
          <Tree
            path={path}
            insertNode={insertNode}
            deleteNode={deleteNode}
            moveNode={moveNode}
            moveUp={moveUp}
            moveDown={moveDown}
            moveToParent={moveToParent}
            moveToPrevSibling={moveToPrevSibling}
            unwrap={unwrap}
            onDragStart={onDragStart}
            onDrop={onDrop}
            setDropPath={setDropPath}
            dropPath={dropPath}
            isDragged={isDragged}
            fold={fold}
            unfold={unfold}
            // eslint-disable-next-line react/no-children-prop
            tree={node.children}
            component={component}
            select={select}
            multiSelect={multiSelect}
            selectRange={selectRange}
            unselect={unselect}
            selection={selection}
          />
        </div>
      )}

      {dropspot === "below" && (
        <div className={styles.dropspot_wrapper}>
          <div className={styles.dropspot}/>
        </div>
      )}
    </div>
  )
}

function Tree<T extends MinimalTreeNode<T>>({
  path,
  tree,
  insertNode,
  deleteNode,
  moveNode,
  moveUp,
  moveDown,
  moveToParent,
  moveToPrevSibling,
  unwrap,
  onDragStart,
  onDrop,
  setDropPath,
  dropPath,
  isDragged,
  fold,
  unfold,
  component,
  select,
  multiSelect,
  selectRange,
  unselect,
  selection
}: TreeProps<T>) {
  const subDropPath = dropPath && dropPath.length > 1
    ? dropPath.slice(1)
    : null;
  const dropIndex: number | undefined = dropPath
    ? dropPath[0]
    : undefined;

  function calcDropspot(index: number, dropIndex?: number) {
    if (dropIndex === index) return "above";
    if (dropIndex === index + 1) return "below";
    return null;
  }

  return (
    <div className={styles.tree}>
      {tree.map((node, i) => (
        <TreeNode
          key={node.id}
          path={[...path, i]}
          tree={tree}
          insertNode={insertNode}
          deleteNode={deleteNode}
          moveNode={moveNode}
          moveUp={moveUp}
          moveDown={moveDown}
          moveToParent={moveToParent}
          moveToPrevSibling={moveToPrevSibling}
          unwrap={unwrap}
          onDragStart={onDragStart}
          onDrop={onDrop}
          setDropPath={setDropPath}
          dropPath={i === dropIndex ? subDropPath : null}
          dropspot={!subDropPath || subDropPath.length === 0 ? calcDropspot(i, dropIndex) : null}
          isDragged={isDragged}
          fold={fold}
          unfold={unfold}
          node={node}
          component={component}
          select={select}
          multiSelect={multiSelect}
          selectRange={selectRange}
          unselect={unselect}
          selection={selection && selection[i]}
        />
      ))}
    </div>
  )
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type RootTreeFromCommonProps<T extends MinimalTreeNode<T>> = Omit<
  TreeProps<T>,
  "path"
  | "onDragStart"
  | "onDrop"
  | "isDragged"
  | "setDropPath"
  | "dropPath"
  | "select"
  | "multiSelect"
  | "selectRange"
  | "unselect"
>;
type RootTreeExtends<T extends MinimalTreeNode<T>> = Optional<
  RootTreeFromCommonProps<T>,
  "insertNode"
  | "deleteNode"
  | "moveNode"
  | "moveUp"
  | "moveDown"
  | "moveToParent"
  | "moveToPrevSibling"
  | "unwrap"
  | "fold"
  | "unfold"
>;

interface RootTreeProps<T extends MinimalTreeNode<T>> extends RootTreeExtends<T> {
  setTree?: (tree: T[]) => void,
  setSelection?: (selection: Selection) => void,
  deleteSelected?: () => void,
  moveSelected?: (to: TreePath) => void,
}

export function RootTree<T extends MinimalTreeNode<T>>({
  tree,
  setTree,
  insertNode,
  deleteNode,
  moveNode,
  moveUp,
  moveDown,
  moveToParent,
  moveToPrevSibling,
  unwrap,
  deleteSelected,
  moveSelected,
  fold,
  unfold,
  component,
  selection,
  setSelection,
}: RootTreeProps<T>) {
  const [isDragged, setIsDragged] = useState(false);
  const [dropPath, setDropPath] = useState<TreePath | null>(null);

  function _insertNode(at: TreePath, node: T) {
    if (typeof insertNode === "function") {
      insertNode(at, node);
    } else if (typeof setTree === "function") {
      const newTree = transformInsertTree(tree, at, node);
      if (!newTree) return;
      setTree(newTree);
      if (selection && setSelection) {
        const transformedSelection = transformInsertSelection(selection, at);
        setSelection(transformedSelection);
      }
    }
  }

  function _deleteNode(at: TreePath) {
    if (typeof deleteNode === "function") {
      deleteNode(at);
    } else if (typeof setTree === "function") {
      const newTree = transformDeleteTree(tree, at);
      if (!newTree) return;
      setTree(newTree);
      if (selection && setSelection) {
        const transformedSelection = transformDeleteSelection(selection, at);
        setSelection(transformedSelection);
      }
    }
  }

  function _moveNode(from: TreePath, to: TreePath) {
    if (typeof moveNode === "function") {
      moveNode(from, to);
    } else if (typeof setTree === "function") {
      const newTree = transformMoveTree(tree, from, to);
      if (!newTree) return;
      setTree(newTree);
      if (selection && setSelection) {
        const transformedSelection = transformMoveSelection(selection, from, to);
        setSelection(transformedSelection);
      }
    }
  }

  function _moveUp(path: TreePath) {
    if (typeof moveUp === "function") {
      moveUp(path);
    } else if (typeof setTree === "function") {
      if (path[path.length - 1] === 0) {
        return;
      }
      const to = [...path];
      to[to.length - 1] -= 1;
      _moveNode(path, to);
    }
  }

  function _moveDown(path: TreePath) {
    if (typeof moveDown === "function") {
      moveDown(path);
    } else if (typeof setTree === "function") {
      const to = [...path];
      to[to.length - 1] += 2;
      _moveNode(path, to);
    }
  }

  function _moveToParent(path: TreePath) {
    if (typeof moveToParent === "function") {
      moveToParent(path);
    } else if (typeof setTree === "function") {
      if (path.length < 2) {
        return;
      }
      const to = path.slice(0, path.length - 1);
      to[to.length - 1] += 1;
      _moveNode(path, to);
    }
  }

  function _moveToPrevSibling(path: TreePath) {
    if (typeof moveToPrevSibling === "function") {
        moveToPrevSibling(path);
    } else if (typeof setTree === "function") {
      let last = path[path.length - 1];
      if (last == 0) return;
      const to = [...path];
      to[to.length - 1] -= 1;
      const prevSibling = getNode(tree, to);
      const prevSiblingTotalChildren = prevSibling?.children?.length;
      if (typeof prevSiblingTotalChildren !== "number") return;
      to.push(prevSiblingTotalChildren);
      _moveNode(path, to);
    }
  }

  function _unwrap(path: TreePath) {
    if (typeof unwrap === "function") {
        unwrap(path);
    } else if (typeof setTree === "function") {
      const newTree = apply(
        tree,
        path,
        (parentChildren, index) => {
          if (index >= parentChildren.length) return false;

          const children = parentChildren[index].children;
          if (!children) {
            parentChildren.splice(index, 1);
            return true;
          } else {
            parentChildren.splice(index, 1, ...children);
          }

          if (selection && setSelection) {
            let transformedSelection = selection;
            let transformedPath = path;

            for (let i = children.length - 1; i >= 0; i--) {
              const path_i = [...path, i];
              transformedSelection = transformMoveSelection(
                transformedSelection,
                path_i,
                path
              );
              transformedPath = transformMovePath(
                transformedPath,
                PathType.Exact,
                path_i, path
              );
            }

            transformedSelection = transformDeleteSelection(
              transformedSelection,
              transformedPath
            );

            setSelection(transformedSelection);
          }

          return true;
        }
      );

      if (!newTree) return;
      setTree(newTree);
    }
  }

  function _fold(path: TreePath) {
    if (typeof fold === "function") {
      fold(path);
    } else if (typeof setTree === "function") {
    }
  }

  function _unfold(path: TreePath) {
    if (typeof unfold === "function") {
      unfold(path);
    } else if (typeof setTree === "function") {
    }
  }

  function _select(path: TreePath) {
    if (typeof setSelection === "function") {
      let newSelection: Selection = {};
      for (let i = path.length - 1; i >= 0; i--) {
        newSelection = { [path[i]]: newSelection };
      }
      setSelection(newSelection);
    }
  }

  function _multiSelect(path: TreePath) {
    if (typeof setSelection === "function") {
      let newSelection = { ...selection };
      let subSelection = newSelection;
      for (let i = 0; i < path.length; i++) {
        if (subSelection[path[i]] === undefined || i == path.length - 1) {
          subSelection[path[i]] = {};
        } else {
          subSelection[path[i]] = { ...subSelection[path[i]] };
        }
        subSelection = subSelection[path[i]];
      }
      setSelection(newSelection);
    }
  }

  function _selectRange(_: TreePath) {
    if (typeof setSelection === "function") {
      // TODO
      console.log("TODO: selectRange");
    }
  }

  function _unselect(path: TreePath) {
    if (typeof setSelection === "function") {
      let deleteAtDepth: number | null = null;
      let shouldDelete = false;

      {
        let subSelection = selection;
        for (let i = 0; i < path.length; i++) {
          const index = path[i];

          if (subSelection[index] === undefined) return;

          const isLast = i === path.length - 1;
          const length = Object.keys(subSelection[index]).length;

          if (isLast && length === 0) {
            shouldDelete = true;
          }

          if (length > 1) {
            deleteAtDepth = null;
          } else if (deleteAtDepth === null) {
            deleteAtDepth = i + 1;
          }

          subSelection[index] = { ...subSelection[index] };
          subSelection = subSelection[index];
        }
      }

      if (shouldDelete && deleteAtDepth !== null) {
        let newSelection = { ...selection };
        let subSelection = newSelection;
        let deletePath = path.slice(0, deleteAtDepth);

        for (let i = 0; i < deletePath.length; i++) {
          const index = deletePath[i];
          if (i === deletePath.length - 1) {
            delete subSelection[index];
            break;
          }
          subSelection[index] = { ...subSelection[index] };
          subSelection = subSelection[index];
        }

        setSelection(newSelection);
      }
    }
  }

  const _deleteSelected = useCallback(function () {
    if (typeof deleteSelected === "function") {
      deleteSelected();
    } else if (typeof setTree === "function") {
      if (!selection) return;

      const paths: (TreePath | undefined)[] = selectionToPaths(selection);
      let newTree = tree;

      for (let i = 0; i < paths.length; i++) {
        const path_i = paths[i];
        if (!path_i) continue;

        const transformedTree = transformDeleteTree(newTree, path_i);

        if (!transformedTree) continue;
        newTree = transformedTree;

        for (let j = 0; j < paths.length; j++) {
          const path_j = paths[j];
          if (!path_j) continue;
          paths[j] = transformDeletePath(path_j, PathType.Exact, path_i);
        }
      }

      setTree(newTree);

      if (!setSelection) return;
      const transformedPaths: TreePath[] = [];
      paths.forEach(p => {
        if (p) transformedPaths.push(p);
      });
      setSelection(pathsToSelection(transformedPaths));
    }
  }, [tree, selection, setTree, setSelection, deleteSelected])

  function _moveSelected() {
    if (!dropPath || dropPath.length === 0) return;

    if (typeof moveSelected === "function") {
      moveSelected(dropPath);
    } else if (typeof setTree === "function") {
      if (!selection) return;

      const paths: (TreePath | undefined)[] = selectionToPaths(selection);
      let newTree = tree;

      for (let i = 0; i < paths.length; i++) {
        const path_i = paths[i];
        if (!path_i) continue;

        const to_i = [...dropPath];
        to_i[to_i.length - 1] += i;

        const transformedTree = transformMoveTree(newTree, path_i, to_i);

        if (!transformedTree) continue;
        newTree = transformedTree;

        for (let j = 0; j < paths.length; j++) {
          const path_j = paths[j];
          if (!path_j) continue;
          paths[j] = transformMovePath(path_j, PathType.Exact, path_i, to_i);
        }
      }

      setTree(newTree);

      if (!setSelection) return;
      const transformedPaths: TreePath[] = [];
      paths.forEach(p => {
        if (p) transformedPaths.push(p);
      });
      setSelection(pathsToSelection(transformedPaths));
    }

    setDropPath(null);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Backspace" || e.key === "Delete") {
        _deleteSelected();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return function () {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [_deleteSelected]);

  useEffect(() => {
    function handleMouseUp() {
      setIsDragged(false);
      setDropPath(null);
    }
    window.addEventListener("mouseup", handleMouseUp);

    return function () {
      window.removeEventListener("mouseup", handleMouseUp);
    }
  }, []);

  return (
    <div
      onMouseLeave={() => setDropPath(null)}
      onMouseUp={() => { if (isDragged)  _moveSelected() }}
    >
      <Tree
        path={[]}
        insertNode={_insertNode}
        deleteNode={_deleteNode}
        moveNode={_moveNode}
        moveUp={_moveUp}
        moveDown={_moveDown}
        moveToParent={_moveToParent}
        moveToPrevSibling={_moveToPrevSibling}
        unwrap={_unwrap}
        onDragStart={() => setIsDragged(true)}
        onDrop={() => {}}
        setDropPath={setDropPath}
        dropPath={dropPath}
        isDragged={isDragged}
        fold={_fold}
        unfold={_unfold}
        // eslint-disable-next-line react/no-children-prop
        tree={tree}
        component={component}
        selection={selection}
        select={selection && _select}
        multiSelect={selection && _multiSelect}
        selectRange={selection && _selectRange}
        unselect={selection && _unselect}
      />
    </div>
  );
}

/**
 * Get a reference of the node at path.
 */
function getNode<T extends MinimalTreeNode<T>>(
  tree: T[],
  path: TreePath,
) {
  let subTree = tree;

  for (let i = 0; i < path.length; i++) {
    let index = path[i];
    const isLast = i === path.length - 1;

    if (isLast) {
      return subTree[index];
    }

    const children = subTree[index].children;
    if (!children) return;

    subTree = children;
  }
}

function apply<T extends MinimalTreeNode<T>>(
  tree: T[],
  path: TreePath,
  cb: (parentChildren: T[], index: number) => boolean
) {
  const newTree = [ ...tree ];
  let subTree = newTree;

  for (let i = 0; i < path.length; i++) {
    let index = path[i];
    const isLast = i === path.length - 1;

    if (isLast) {
      if (cb(subTree, index)) return newTree;
      return;
    }

    const childrenOri = subTree[index].children;

    if (childrenOri === undefined) {
      // No-op.
      // The path is invalid.
      return;
    }

    const children = [...childrenOri];

    subTree[index] = {
      ...subTree[index],
      children
    };

    subTree = children;
  }
}

/**
 * Check if `path`'s parent is an anchestor of `other`.
 */
function isParentAnchestorOfOther(path: TreePath, other: TreePath) {
  if (path.length > other.length) {
    return false;
  }

  for (let i = 0; i < path.length - 1; i++) {
    if (path[i] !== other[i]) {
      return false;
    }
  }

  return true;
}

enum PathType {
  Exact,
  Anchor
}

function transformInsertPath(
  path: TreePath,
  pathType: PathType,
  insertAt: TreePath
) {
  if (!isParentAnchestorOfOther(insertAt, path)) {
    return path;
  }

  const lastPointer = insertAt.length - 1;

  if (path[lastPointer] < insertAt[lastPointer]) {
    return path;
  }

  if (path[lastPointer] > insertAt[lastPointer]) {
    const newPath = [...path];
    newPath[lastPointer] += 1;
    return newPath;
  }

  if (pathType === PathType.Exact) {
    const newPath = [...path];
    newPath[lastPointer] += 1;
    return newPath;
  } else {
    return path;
  }
}

function transformDeletePath(
  path: TreePath,
  pathType: PathType,
  deleteAt: TreePath
) {
  if (!isParentAnchestorOfOther(deleteAt, path)) {
    return path;
  }

  const lastPointer = deleteAt.length - 1;

  if (path[lastPointer] < deleteAt[lastPointer]) {
    return path;
  }

  if (path[lastPointer] > deleteAt[lastPointer]) {
    const newPath = [...path];
    newPath[lastPointer] -= 1;
    return newPath;
  }

  if (pathType === PathType.Exact) {
    return;
  } else {
    return path;
  }
}

function transformMovePath(
  path: TreePath,
  pathType: PathType,
  from: TreePath,
  to: TreePath
) {
  // The move transformation is a litle bit more complecated, but we can
  // simplify it by converting it into delete + insert transformation.
  // `from` and `to` is pointing to the same doc version.  We have to
  // transform (delete) `to` into `insertAt` so the insert operation points to
  // a doc that has been applied the delete operation.
  const insertPathAfterDelete = transformDeletePath(to, PathType.Anchor, from);

  if (!insertPathAfterDelete) {
    return path;
  }

  const pathAfterDelete = transformDeletePath(path, pathType, from);

  if (!pathAfterDelete) {
    return [...to, ...path.slice(from.length)];
  }

  return transformInsertPath(pathAfterDelete, pathType, insertPathAfterDelete);
}

function transformInsertSelection(selection: Selection, at: TreePath) {
  const transformedPaths = selectionToPaths(selection)
    .map(path => transformInsertPath(path, PathType.Exact, at));
  const transformedSelection = pathsToSelection(transformedPaths);
  return transformedSelection;
}

function transformDeleteSelection(selection: Selection, at: TreePath) {
  const transformedPaths: TreePath[] = [];
  selectionToPaths(selection)
    .forEach(path => {
      const transformed = transformDeletePath(path, PathType.Exact, at);
      if (transformed) {
        transformedPaths.push(transformed);
      }
    });
  const transformedSelection = pathsToSelection(transformedPaths);
  return transformedSelection;
}

function transformMoveSelection(selection: Selection, from: TreePath, to: TreePath) {
  const transformedPaths = selectionToPaths(selection)
    .map(path => transformMovePath(path, PathType.Exact, from, to));

  const transformedSelection = pathsToSelection(transformedPaths);
  return transformedSelection;
}

function transformInsertTree<T extends MinimalTreeNode<T>>(tree: T[], at: TreePath, node: T) {
  return apply(
    tree,
    at,
    (children, index) => {
      if (index > children.length) return false;
      children.splice(index, 0, node);
      return true;
    }
  );
}

function transformDeleteTree<T extends MinimalTreeNode<T>>(tree: T[], at: TreePath) {
  return apply(
    tree,
    at,
    (children, index) => {
      if (index >= children.length) return false;
      children.splice(index, 1);
      return true;
    }
  );
}

function transformMoveTree<T extends MinimalTreeNode<T>>(tree: T[], from: TreePath, to: TreePath) {
  if (isParentAnchestorOfOther(from, to)) {
    const fromLastIndex = from.length - 1;
    const fromLast = from[fromLastIndex];
    const toLast = to[fromLastIndex];

    if (fromLast === toLast || (from.length === to.length && fromLast + 1 === toLast)) {
      // End up at the same position.
      return;
    }

    if (toLast > fromLast) {
      to[fromLastIndex] -= 1;
    }
  }

  let movedNode: T | undefined;
  const newTreeDeleted = apply(
    tree,
    from,
    (children, index) => {
      if (index >= children.length) return false;
      const deleted = children.splice(index, 1);
      if (deleted.length === 0) return false;
      movedNode = deleted[0];
      return true;
    }
  );

  if (!movedNode || !newTreeDeleted) return;

  const nodeToInsert = movedNode;

  const newTree = apply(
    newTreeDeleted,
    to,
    (children, index) => {
      if (index > children.length) return false;
      children.splice(index, 0, nodeToInsert);
      return true;
    }
  );

  if (!newTree) return;

  return newTree;
}

function selectionToPathsRecursive(anchestors: TreePath, selection: Selection): TreePath[] {
  if (Object.keys(selection).length === 0) {
    return [anchestors];
  }
  return Object.entries(selection)
    .map(([k, v]) => selectionToPathsRecursive([...anchestors, Number(k)], v))
    .flat();
}

export function selectionToPaths(selection: Selection) {
  if (Object.keys(selection).length === 0) {
    return [];
  }
  return selectionToPathsRecursive([], selection);
}

export function pathsToSelection(paths: TreePath[]) {
  let newSelection: Selection = {};

  for (const path of paths) {
    let subSelection = newSelection;

    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      const isSelected = typeof subSelection[index] === "object"
        && Object.keys(subSelection[index]).length === 0;

      if (isSelected) {
        // The current node is selected.
        // Its decendants can't be selected.
        break;
      }

      if (typeof subSelection[index] === "undefined" || i === path.length - 1) {
        subSelection[index] = {};
      }

      subSelection = subSelection[index];
    }
  }

  return newSelection;
}

