export interface Doc {
  id: string,
  type: DocType,
  title: string,
  children: Element[],
}

export enum DocType {
  Page = "page",
  Component = "component",
}

export type Element =
  ComponentRefElement
  | LayoutElement
  | TextElement
  | InputElement
  | ButtonElement;

export enum ElementType {
  ComponentRef = "component_ref",
  Layout = "layout",
  Text = "text",
  Input = "input",
  Button = "button",
}

interface ElementBase {
  id: string,
  type: ElementType,
  name: string,
}

export interface ComponentRefElement extends ElementBase {
  type: ElementType.ComponentRef,
  docId: string,
}

export interface LayoutElement extends ElementBase {
  type: ElementType.Layout,
  direction: LayoutDirection,
  children: Element[]
}

export enum LayoutDirection {
  Row = "row",
  Column = "column",
}

export interface TextElement extends ElementBase {
  type: ElementType.Text,
  text: string,
  fontSize: number,
}

export interface InputElement extends ElementBase {
  type: ElementType.Input,
  placeholder: string,
}

export interface ButtonElement extends ElementBase {
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
  tree: Element[],
  operation: Operation
): { tree: Element[], undo: Operation } | null {
  switch (operation.type) {
    case OperationType.Insert:
      return applyInsert(tree, operation);
    case OperationType.Delete:
      return applyDelete(tree, operation);
    case OperationType.Move:
      return applyMove(tree, operation);
    case OperationType.Set:
      return applySet(tree, operation);
  }
}

function applyInsert(
  tree: Element[],
  operation: InsertOperation
): { tree: Element[], undo: DeleteOperation } | null {
  const newTree = apply(
    tree,
    operation.path,
    (children, index) => {
      if (index < 0 || index > children.length) {
        return false;
      }
      children.splice(index, 0, operation.element);
      return true;
    }
  );

  if (!newTree) {
    return null;
  }

  return {
    tree: newTree,
    undo: {
      type: OperationType.Delete,
      path: [...operation.path]
    }
  };
}

function applyDelete(
  tree: Element[],
  operation: DeleteOperation
): { tree: Element[], undo: InsertOperation } | null {
  let deleted: Element | undefined;

  const newTree = apply(
    tree,
    operation.path,
    (children, index) => {
      if (index < 0 || index >= children.length) {
        return false;
      }
      deleted = children.splice(index, 1)[0];
      return true;
    }
  );

  if (!newTree) {
    return null;
  }

  return {
    tree: newTree,
    undo: {
      type: OperationType.Insert,
      path: [...operation.path],
      element: deleted
    }
  };
}

function applyMove(
  tree: Element[],
  operation: MoveOperation
): { tree: Element[], undo: MoveOperation } | null {
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

  const deleteRes = applyDelete(tree, deleteOp);
  if (!deleteRes) {
    return null;
  }
  const insertOp: InsertOperation = {
    type: OperationType.Insert,
    path: insertAt,
    element: deleteRes.undo.element
  };
  const insertRes = applyInsert(deleteRes.tree, insertOp);

  if (!insertRes) {
    return null;
  }

  const undoTo = transformPathAfterInsert(
    operation.from,
    PathType.Anchor,
    insertAt
  );

  return {
    tree: insertRes.tree,
    undo: {
      type: OperationType.Move,
      from: insertAt,
      to: undoTo,
    }
  }
}

function applySet(
  tree: Element[],
  operation: SetOperation
): { tree: Element[], undo: SetOperation } | null {
  let replacedValue: any;

  const newTree = apply(
    tree,
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

  if (!newTree) {
    return null;
  }

  return {
    tree: newTree,
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

export function cleanRebase(ops: Operation[], base: Operation[]): Operation[] {
  const rebased = rebase(ops, base);
  const cleaned: Operation[] = [];

  for (const op of rebased) {
    if (op) {
      cleaned.push(op);
    }
  }

  return cleaned;
}

export function rebase(ops: Operation[], base: Operation[]): (Operation | null)[] {
  const transformed: (Operation | null)[] = new Array(ops.length).fill(null);

  i: for (let i = 0; i < ops.length; i++) {
    let op = ops[i];

    for (let j = i - 1; j >= 0; j--) {
      // Transform backward against prev operations in the transaction.
      const prevOp = ops[j];
      const newOp = transformBackward(op, prevOp);

      if (newOp) {
        op = newOp;
        continue;
      }

      // It can't be transformed backward, let's map it.
      const transformedPrevOp = transformed[j];

      if (!transformedPrevOp) {
        continue i;
      }

      const mapped = map(op, prevOp, transformedPrevOp);

      if (!mapped) {
        continue i;
      }

      // Transform forward against prev operations after the mapper.
      for (let k = j + 1; k < ops.length; k++) {
        const transformedPrevOp = transformed[k];
        if (!transformedPrevOp) {
          continue i;
        }
        const newOp = transformForward(op, transformedPrevOp);
        if (!newOp) {
          continue i;
        }
        op = newOp;
      }

      transformed[i] = op;

      continue i;
    }

    // Transform forward against commited transactions.
    for (let j = 0; j < base.length; j++) {
      const newOp = transformForward(op, base[j]);
      if (!newOp) {
        continue i;
      }
      op = newOp;
    }

    // Transform forward against the final prev operations.
    for (let j = 0; j < i; j++) {
      const transformedPrevOp = transformed[j];
      if (!transformedPrevOp) {
        continue;
      }
      const newOp = transformForward(op, transformedPrevOp);
      if (!newOp) {
        continue i;
      }
      op = newOp;
    }

    transformed[i] = op;
  }

  return transformed;
}

export function transformForward(op: Operation, after: Operation): Operation | null {
  switch (op.type) {
    case OperationType.Insert: {
      const newPath = transformPathAfterOperation(op.path, PathType.Anchor, after);
      if (!newPath) {
        return null;
      }
      const newOp: InsertOperation = {
        type: OperationType.Insert,
        path: newPath,
        element: op.element,
      };
      return newOp;
    }

    case OperationType.Delete: {
      const newPath = transformPathAfterOperation(op.path, PathType.Exact, after);
      if (!newPath) {
        return null;
      }
      const newOp: DeleteOperation = {
        type: OperationType.Delete,
        path: newPath,
      };
      return newOp;
    }

    case OperationType.Move: {
      const newFrom = transformPathAfterOperation(op.from, PathType.Exact, after);
      if (!newFrom) {
        return null;
      }
      const newTo = transformPathAfterOperation(op.to, PathType.Anchor, after);
      if (!newTo) {
        return null;
      }
      const newOp: MoveOperation = {
        type: OperationType.Move,
        from: newFrom,
        to: newTo,
      };
      return newOp;
    }

    case OperationType.Set: {
      const newPath = transformPathAfterOperation(op.path, PathType.Exact, after);
      if (!newPath) {
        return null;
      }
      const newOp: SetOperation = {
        type: OperationType.Set,
        path: newPath,
        prop: op.prop,
        value: op.value,
      };
      return newOp;
    }
  }
}

export function transformBackward(op: Operation, before: Operation): Operation | null {
  switch (op.type) {
    case OperationType.Insert: {
      const newPath = transformPathBeforeOperation(op.path, PathType.Anchor, before);
      if (!newPath) {
        return null;
      }
      const newOp: InsertOperation = {
        type: OperationType.Insert,
        path: newPath,
        element: op.element,
      };
      return newOp;
    }

    case OperationType.Delete: {
      const newPath = transformPathBeforeOperation(op.path, PathType.Exact, before);
      if (!newPath) {
        return null;
      }
      const newOp: DeleteOperation = {
        type: OperationType.Delete,
        path: newPath,
      };
      return newOp;
    }

    case OperationType.Move: {
      const newFrom = transformPathBeforeOperation(op.from, PathType.Exact, before);
      if (!newFrom) {
        return null;
      }
      const newTo = transformPathBeforeOperation(op.to, PathType.Anchor, before);
      if (!newTo) {
        return null;
      }
      const newOp: MoveOperation = {
        type: OperationType.Move,
        from: newFrom,
        to: newTo,
      };
      return newOp;
    }

    case OperationType.Set: {
      const newPath = transformPathBeforeOperation(op.path, PathType.Exact, before);
      if (!newPath) {
        return null;
      }
      const newOp: SetOperation = {
        type: OperationType.Set,
        path: newPath,
        prop: op.prop,
        value: op.value,
      };
      return newOp;
    }
  }
}

export function map(op: Operation, before: Operation, after: Operation): Operation {
  switch (op.type) {
    case OperationType.Insert: {
      const newPath = mapPathByTransformedOperation(op.path, PathType.Anchor, before, after);
      const newOp: InsertOperation = {
        type: OperationType.Insert,
        path: newPath,
        element: op.element,
      };
      return newOp;
    }

    case OperationType.Delete: {
      const newPath = mapPathByTransformedOperation(op.path, PathType.Exact, before, after);
      const newOp: DeleteOperation = {
        type: OperationType.Delete,
        path: newPath,
      };
      return newOp;
    }

    case OperationType.Move: {
      const newFrom = mapPathByTransformedOperation(op.from, PathType.Exact, before, after);
      const newTo = mapPathByTransformedOperation(op.to, PathType.Anchor, before, after);
      const newOp: MoveOperation = {
        type: OperationType.Move,
        from: newFrom,
        to: newTo,
      };
      return newOp;
    }

    case OperationType.Set: {
      const newPath = mapPathByTransformedOperation(op.path, PathType.Exact, before, after);
      const newOp: SetOperation = {
        type: OperationType.Set,
        path: newPath,
        prop: op.prop,
        value: op.value,
      };
      return newOp;
    }
  }
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
  pathType: PathType,
  opBefore: Operation,
  opAfter: Operation
): Path {
  if (
    opBefore.type === OperationType.Insert
    && opAfter.type === OperationType.Insert
    && isAnchestorOrEqual(path, opBefore.path)
  ) {
    const isEqual = path.length === opBefore.path.length;
    if (isEqual && pathType === PathType.Anchor) {
      throw new Error("Invalid path mapping")
    }
    return [...opAfter.path, ...path.slice(opBefore.path.length)];
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
    return [...insertPathAfterDelete, ...path.slice(from.length)];
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
  const pathBeforeInsert = transformPathBeforeInsert(path, pathType, to);
  if (!pathBeforeInsert) {
    return from;
  }
  return transformPathBeforeDelete(pathBeforeInsert, pathType, from);
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

function isAnchestorOrEqual(path: Path, other: Path): boolean {
  if (path.length >= other.length) {
    return false;
  }

  for (let i = 0; i < path.length; i++) {
    if (path[i] !== other[i]) {
      return false;
    }
  }

  return true;
}
