export interface Doc {
  id: string,
  type: DocType,
  title: string,
  content: Element[],
}

export enum DocType {
  Page = "page",
  Component = "component",
}

export type Element =
  LayoutElement
  | TextElement
  | InputElement
  | ButtonElement;

export enum ElementType {
  Layout = "layout",
  Text = "text",
  Input = "input",
  Button = "button",
}

interface LayoutElement {
  type: ElementType.Layout,
  direction: LayoutDirection,
  children: Element[]
}

export enum LayoutDirection {
  Row = "row",
  Column = "column",
}

export interface TextElement {
  type: ElementType.Text,
  text: string,
  fontSize: number,
}

export interface InputElement {
  type: ElementType.Input,
  placeholder: string,
  size: number,
}

export interface ButtonElement {
  type: ElementType.Button,
  text: string
}

export type Operation =
  InsertOperation
  | DeleteOperation
  | MoveOperation
  | SetOperation;

export enum OperationType {
  Insert = "insert",
  Delete = "delete",
  Move = "move",
  Set = "set",
}

export interface InsertOperation {
  type: OperationType.Insert,
  path: Path,
  element: Element,
}

export interface DeleteOperation {
  type: OperationType.Delete,
  path: Path,
}

export interface MoveOperation {
  type: OperationType.Move,
  from: Path,
  to: Path,
}

export interface SetOperation {
  type: OperationType.Set,
  path: Path,
  prop: string,
  value: any,
}

export type Path = number[];

export enum PathType {
  Exact,
  Anchor,
}

export function applyOperation(
  content: Element[],
  operation: Operation
): { content: Element[], undo: Operation } | null {
  switch (operation.type) {
    case OperationType.Insert:
      return applyInsert(content, operation);
    case OperationType.Delete:
      return applyDelete(content, operation);
    case OperationType.Move:
      return applyMove(content, operation);
    case OperationType.Set:
      return applySet(content, operation);
  }
}

function applyInsert(
  content: Element[],
  operation: InsertOperation
): { content: Element[], undo: DeleteOperation } | null {
  const newContent = apply(
    content,
    operation.path,
    (children, index) => {
      if (index < 0 || index > children.length) {
        return false;
      }
      children.splice(index, 0, operation.element);
      return true;
    }
  );

  if (!newContent) {
    return null;
  }

  return {
    content: newContent,
    undo: {
      type: OperationType.Delete,
      path: [...operation.path]
    }
  };
}

function applyDelete(
  content: Element[],
  operation: DeleteOperation
): { content: Element[], undo: InsertOperation } | null {
  let deleted: Element | undefined;

  const newContent = apply(
    content,
    operation.path,
    (children, index) => {
      if (index < 0 || index >= children.length) {
        return false;
      }
      deleted = children.splice(index, 1)[0];
      return true;
    }
  );

  if (!newContent || !deleted) {
    return null;
  }

  return {
    content: newContent,
    undo: {
      type: OperationType.Insert,
      path: [...operation.path],
      element: deleted
    }
  };
}

function applyMove(
  content: Element[],
  operation: MoveOperation
): { content: Element[], undo: MoveOperation } | null {
  const deleteOp: DeleteOperation = {
    type: OperationType.Delete,
    path: operation.from
  };

  const insertAt = transformPathAfterDelete(
    operation.to,
    PathType.Anchor,
    operation.from
  );

  if (!insertAt) {
    return null;
  }

  const deleteRes = applyDelete(content, deleteOp);
  if (!deleteRes) {
    return null;
  }
  const insertOp: InsertOperation = {
    type: OperationType.Insert,
    path: insertAt,
    element: deleteRes.undo.element
  };
  const insertRes = applyInsert(deleteRes.content, insertOp);

  if (!insertRes) {
    return null;
  }

  const undoTo = transformPathAfterInsert(
    operation.from,
    PathType.Anchor,
    insertAt
  );

  return {
    content: insertRes.content,
    undo: {
      type: OperationType.Move,
      from: insertAt,
      to: undoTo,
    }
  }
}

function applySet(
  content: Element[],
  operation: SetOperation
): { content: Element[], undo: SetOperation } | null {
  let replacedValue: any;

  const newContent = apply(
    content,
    operation.path,
    (parentChildren, index) => {
      if (index < 0 || index >= parentChildren.length) {
        return false;
      }
      // TODO: In production we should check the schema.
      // TODO: Deep copy value.
      replacedValue = parentChildren[index][operation.prop];
      parentChildren[index] = {
        ...parentChildren[index],
        [operation.prop]: operation.value
      };
      return true;
    }
  );

  if (!newContent) {
    return null;
  }

  return {
    content: newContent,
    undo: {
      type: OperationType.Set,
      path: [...operation.path],
      prop: operation.prop,
      value: replacedValue
    }
  };
}

function apply(
  tree: Element[],
  path: Path,
  cb: (parentChildren: Element[], index: number) => boolean
): Element[] | null {
  const newTree = [ ...tree ];
  let subTree = newTree;

  for (let i = 0; i < path.length; i++) {
    let index = path[i];
    const isLast = i === path.length - 1;

    if (isLast) {
      if (cb(subTree, index)) return newTree;
      break;
    }

    const subSubTree = { ...subTree[index] };

    // Ensure subSubTree can have children.
    // Otherwise the path is invalid.
    // Check the type directly to pass TS prop check.
    if (subSubTree.type !== ElementType.Layout) break;

    subSubTree.children = [...subSubTree.children];
    subTree[index] = subSubTree;   // Mount the copy.
    subTree = subSubTree.children;
  }

  return null;
}

export function transformPathAfterOperation(
  path: Path,
  pathType: PathType,
  operation: Operation
): Path | null {
  switch (operation.type) {
    case OperationType.Insert:
      return transformPathAfterInsert(path, pathType, operation.path);
    case OperationType.Delete:
      return transformPathAfterDelete(path, pathType, operation.path);
    case OperationType.Move:
      return transformPathAfterMove(path, pathType, operation.from, operation.to);
    case OperationType.Set:
      return path;
  }
}

export function transformPathBeforeOperation(
  path: Path,
  pathType: PathType,
  operation: Operation
): Path | null {
  switch (operation.type) {
    case OperationType.Insert:
      return transformPathBeforeInsert(path, pathType, operation.path);
    case OperationType.Delete:
      return transformPathBeforeDelete(path, pathType, operation.path);
    case OperationType.Move:
      return transformPathBeforeMove(path, pathType, operation.from, operation.to);
    case OperationType.Set:
      return path;
  }
}

/**
  * If a path doesn't exist before an operation, we can map it based on the
  * original operation before it and the transformed operation.
  *
  * In our simple `Operation` there's only a single case where a path doesn't
  * exist before an operation, i.e. exact paths before an insert operation
  * which point to the same position as the insert path.
  *
  * If the transformed `Insert` operation is null (the inserted value is
  * deleted), that path is also deleted, which is not handled by this function.
  *
  * If this function is given other cases, it throws error.
  */
export function mapPathByTransformedOperation(
  path: Path,
  opBefore: Operation,
  opAfter: Operation
): Path {
  if (
    opBefore.type === OperationType.Insert
    && opAfter.type === OperationType.Insert
    && arePathsEqual(path, opBefore.path)
  ) {
    return opAfter.path;
  }

  throw new Error("Invalid path mapping")
}

function transformPathAfterInsert(
  path: Path,
  pathType: PathType,
  insertAt: Path
): Path {
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

function transformPathAfterDelete(
  path: Path,
  pathType: PathType,
  deleteAt: Path
): Path | null {
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
    return null;
  } else {
    return path;
  }
}

function transformPathAfterMove(
  path: Path,
  pathType: PathType,
  from: Path,
  to: Path
): Path {
  // The move transformation is a litle bit more complecated, but we can
  // simplify it by converting it into delete + insert transformation.
  // `from` and `to` is pointing to the same doc version.  We have to
  // transform (delete) `to` into `insertAt` so the insert operation points to
  // a doc that has been applied the delete operation.
  const insertPathAfterDelete = transformPathAfterDelete(to, PathType.Anchor, from);

  if (!insertPathAfterDelete) {
    return path;
  }

  const pathAfterDelete = transformPathAfterDelete(path, pathType, from);

  if (!pathAfterDelete) {
    return [...to, ...path.slice(from.length)];
  }

  return transformPathAfterInsert(pathAfterDelete, pathType, insertPathAfterDelete);
}

function transformPathBeforeInsert(
  path: Path,
  pathType: PathType,
  insertAt: Path,
): Path | null {
  if (!isParentAnchestorOfOther(insertAt, path)) {
    return path;
  }

  const lastPointer = insertAt.length - 1;

  if (path[lastPointer] < insertAt[lastPointer]) {
    return path;
  }

  if (path[lastPointer] > insertAt[lastPointer]) {
    const newPath = [...path];
    newPath[lastPointer] -= 1;
    return newPath;
  }

  if (pathType === PathType.Exact) {
    return null;
  } else {
    return path;
  }
}

function transformPathBeforeDelete(
  path: Path,
  pathType: PathType,
  deleteAt: Path,
): Path {
  if (!isParentAnchestorOfOther(deleteAt, path)) {
    return path;
  }

  const lastPointer = deleteAt.length - 1;

  if (path[lastPointer] === deleteAt[lastPointer] && pathType === PathType.Anchor) {
    return path;
  }

  if (path[lastPointer] < deleteAt[lastPointer]) {
    return path;
  }

  const newPath = [...path];
  newPath[lastPointer] += 1;
  return newPath;
}

function transformPathBeforeMove(
  path: Path,
  pathType: PathType,
  from: Path,
  to: Path,
): Path {
  const deletePathBeforeInsert = transformPathBeforeInsert(from, PathType.Anchor, to);

  if (!deletePathBeforeInsert) {
    return path;
  }

  const pathBeforeInsert = transformPathBeforeInsert(path, pathType, from);

  if (!pathBeforeInsert) {
    return from;
  }

  return transformPathBeforeDelete(pathBeforeInsert, pathType, deletePathBeforeInsert);
}

/**
 * Check if `path`'s parent is an anchestor of `other`.
 */
function isParentAnchestorOfOther(path: Path, other: Path) {
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

function arePathsEqual(path: Path, other: Path): boolean {
  if (path.length !== other.length) {
    return false;
  }

  for (let i = 0; i < path.length; i++) {
    if (path[i] !== other[i]) {
      return false;
    }
  }

  return true;
}
