"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.mapPathByTransformedOperation = exports.transformPathBeforeOperation = exports.transformPathAfterOperation = exports.map = exports.transformBackward = exports.transformForward = exports.rebase = exports.cleanRebase = exports.applyOperation = exports.PathType = exports.OperationType = exports.LayoutDirection = exports.ElementType = exports.DocType = void 0;
var DocType;
(function (DocType) {
    DocType["Page"] = "page";
    DocType["Component"] = "component";
})(DocType = exports.DocType || (exports.DocType = {}));
var ElementType;
(function (ElementType) {
    ElementType["ComponentRef"] = "component_ref";
    ElementType["Layout"] = "layout";
    ElementType["Text"] = "text";
    ElementType["Input"] = "input";
    ElementType["Button"] = "button";
})(ElementType = exports.ElementType || (exports.ElementType = {}));
var LayoutDirection;
(function (LayoutDirection) {
    LayoutDirection["Row"] = "row";
    LayoutDirection["Column"] = "column";
})(LayoutDirection = exports.LayoutDirection || (exports.LayoutDirection = {}));
var OperationType;
(function (OperationType) {
    OperationType["Insert"] = "insert";
    OperationType["Delete"] = "delete";
    OperationType["Move"] = "move";
    OperationType["Set"] = "set";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
var PathType;
(function (PathType) {
    PathType[PathType["Exact"] = 0] = "Exact";
    PathType[PathType["Anchor"] = 1] = "Anchor";
})(PathType = exports.PathType || (exports.PathType = {}));
function applyOperation(tree, operation) {
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
exports.applyOperation = applyOperation;
function applyInsert(tree, operation) {
    var newTree = apply(tree, operation.path, function (children, index) {
        if (index < 0 || index > children.length) {
            return false;
        }
        children.splice(index, 0, operation.element);
        return true;
    });
    if (!newTree) {
        return null;
    }
    return {
        tree: newTree,
        undo: {
            type: OperationType.Delete,
            path: __spreadArray([], operation.path, true)
        }
    };
}
function applyDelete(tree, operation) {
    var deleted;
    var newTree = apply(tree, operation.path, function (children, index) {
        if (index < 0 || index >= children.length) {
            return false;
        }
        deleted = children.splice(index, 1)[0];
        return true;
    });
    if (!newTree) {
        return null;
    }
    return {
        tree: newTree,
        undo: {
            type: OperationType.Insert,
            path: __spreadArray([], operation.path, true),
            element: deleted
        }
    };
}
function applyMove(tree, operation) {
    var deleteOp = {
        type: OperationType.Delete,
        path: operation.from
    };
    var insertAt = transformPathAfterDelete(operation.to, PathType.Anchor, operation.from);
    if (!insertAt) {
        return null;
    }
    var deleteRes = applyDelete(tree, deleteOp);
    if (!deleteRes) {
        return null;
    }
    var insertOp = {
        type: OperationType.Insert,
        path: insertAt,
        element: deleteRes.undo.element
    };
    var insertRes = applyInsert(deleteRes.tree, insertOp);
    if (!insertRes) {
        return null;
    }
    var undoTo = transformPathAfterInsert(operation.from, PathType.Anchor, insertAt);
    return {
        tree: insertRes.tree,
        undo: {
            type: OperationType.Move,
            from: insertAt,
            to: undoTo
        }
    };
}
function applySet(tree, operation) {
    var replacedValue;
    var newTree = apply(tree, operation.path, function (parentChildren, index) {
        var _a;
        if (index < 0 || index >= parentChildren.length) {
            return false;
        }
        // TODO: In production we should check the schema.
        // TODO: Deep copy value.
        replacedValue = parentChildren[index][operation.prop];
        parentChildren[index] = __assign(__assign({}, parentChildren[index]), (_a = {}, _a[operation.prop] = operation.value, _a));
        return true;
    });
    if (!newTree) {
        return null;
    }
    return {
        tree: newTree,
        undo: {
            type: OperationType.Set,
            path: __spreadArray([], operation.path, true),
            prop: operation.prop,
            value: replacedValue
        }
    };
}
function apply(tree, path, cb) {
    var newTree = __spreadArray([], tree, true);
    var subTree = newTree;
    for (var i = 0; i < path.length; i++) {
        var index = path[i];
        var isLast = i === path.length - 1;
        if (isLast) {
            if (cb(subTree, index))
                return newTree;
            break;
        }
        var subSubTree = __assign({}, subTree[index]);
        // Ensure subSubTree can have children.
        // Otherwise the path is invalid.
        // Check the type directly to pass TS prop check.
        if (subSubTree.type !== ElementType.Layout)
            break;
        subSubTree.children = __spreadArray([], subSubTree.children, true);
        subTree[index] = subSubTree; // Mount the copy.
        subTree = subSubTree.children;
    }
    return null;
}
function cleanRebase(ops, base) {
    var rebased = rebase(ops, base);
    var cleaned = [];
    for (var _i = 0, rebased_1 = rebased; _i < rebased_1.length; _i++) {
        var op = rebased_1[_i];
        if (op) {
            cleaned.push(op);
        }
    }
    return cleaned;
}
exports.cleanRebase = cleanRebase;
function rebase(ops, base) {
    var transformed = new Array(ops.length).fill(null);
    i: for (var i = 0; i < ops.length; i++) {
        var op = ops[i];
        for (var j = i - 1; j >= 0; j--) {
            // Transform backward against prev operations in the transaction.
            var prevOp = ops[j];
            var newOp = transformBackward(op, prevOp);
            if (newOp) {
                op = newOp;
                continue;
            }
            // It can't be transformed backward, let's map it.
            var transformedPrevOp = transformed[j];
            if (!transformedPrevOp) {
                continue i;
            }
            var mapped = map(op, prevOp, transformedPrevOp);
            if (!mapped) {
                continue i;
            }
            // Transform forward against prev operations after the mapper.
            for (var k = j + 1; k < ops.length; k++) {
                var transformedPrevOp_1 = transformed[k];
                if (!transformedPrevOp_1) {
                    continue i;
                }
                var newOp_1 = transformForward(op, transformedPrevOp_1);
                if (!newOp_1) {
                    continue i;
                }
                op = newOp_1;
            }
            transformed[i] = op;
            continue i;
        }
        // Transform forward against commited transactions.
        for (var j = 0; j < base.length; j++) {
            var newOp = transformForward(op, base[j]);
            if (!newOp) {
                continue i;
            }
            op = newOp;
        }
        // Transform forward against the final prev operations.
        for (var j = 0; j < i; j++) {
            var transformedPrevOp = transformed[j];
            if (!transformedPrevOp) {
                continue;
            }
            var newOp = transformForward(op, transformedPrevOp);
            if (!newOp) {
                continue i;
            }
            op = newOp;
        }
        transformed[i] = op;
    }
    return transformed;
}
exports.rebase = rebase;
function transformForward(op, after) {
    switch (op.type) {
        case OperationType.Insert: {
            var newPath = transformPathAfterOperation(op.path, PathType.Anchor, after);
            if (!newPath) {
                return null;
            }
            var newOp = {
                type: OperationType.Insert,
                path: newPath,
                element: op.element
            };
            return newOp;
        }
        case OperationType.Delete: {
            var newPath = transformPathAfterOperation(op.path, PathType.Exact, after);
            if (!newPath) {
                return null;
            }
            var newOp = {
                type: OperationType.Delete,
                path: newPath
            };
            return newOp;
        }
        case OperationType.Move: {
            var newFrom = transformPathAfterOperation(op.from, PathType.Exact, after);
            if (!newFrom) {
                return null;
            }
            var newTo = transformPathAfterOperation(op.to, PathType.Anchor, after);
            if (!newTo) {
                return null;
            }
            var newOp = {
                type: OperationType.Move,
                from: newFrom,
                to: newTo
            };
            return newOp;
        }
        case OperationType.Set: {
            var newPath = transformPathAfterOperation(op.path, PathType.Exact, after);
            if (!newPath) {
                return null;
            }
            var newOp = {
                type: OperationType.Set,
                path: newPath,
                prop: op.prop,
                value: op.value
            };
            return newOp;
        }
    }
}
exports.transformForward = transformForward;
function transformBackward(op, before) {
    switch (op.type) {
        case OperationType.Insert: {
            var newPath = transformPathBeforeOperation(op.path, PathType.Anchor, before);
            if (!newPath) {
                return null;
            }
            var newOp = {
                type: OperationType.Insert,
                path: newPath,
                element: op.element
            };
            return newOp;
        }
        case OperationType.Delete: {
            var newPath = transformPathBeforeOperation(op.path, PathType.Exact, before);
            if (!newPath) {
                return null;
            }
            var newOp = {
                type: OperationType.Delete,
                path: newPath
            };
            return newOp;
        }
        case OperationType.Move: {
            var newFrom = transformPathBeforeOperation(op.from, PathType.Exact, before);
            if (!newFrom) {
                return null;
            }
            var newTo = transformPathBeforeOperation(op.to, PathType.Anchor, before);
            if (!newTo) {
                return null;
            }
            var newOp = {
                type: OperationType.Move,
                from: newFrom,
                to: newTo
            };
            return newOp;
        }
        case OperationType.Set: {
            var newPath = transformPathBeforeOperation(op.path, PathType.Exact, before);
            if (!newPath) {
                return null;
            }
            var newOp = {
                type: OperationType.Set,
                path: newPath,
                prop: op.prop,
                value: op.value
            };
            return newOp;
        }
    }
}
exports.transformBackward = transformBackward;
function map(op, before, after) {
    switch (op.type) {
        case OperationType.Insert: {
            var newPath = mapPathByTransformedOperation(op.path, PathType.Anchor, before, after);
            var newOp = {
                type: OperationType.Insert,
                path: newPath,
                element: op.element
            };
            return newOp;
        }
        case OperationType.Delete: {
            var newPath = mapPathByTransformedOperation(op.path, PathType.Exact, before, after);
            var newOp = {
                type: OperationType.Delete,
                path: newPath
            };
            return newOp;
        }
        case OperationType.Move: {
            var newFrom = mapPathByTransformedOperation(op.from, PathType.Exact, before, after);
            var newTo = mapPathByTransformedOperation(op.to, PathType.Anchor, before, after);
            var newOp = {
                type: OperationType.Move,
                from: newFrom,
                to: newTo
            };
            return newOp;
        }
        case OperationType.Set: {
            var newPath = mapPathByTransformedOperation(op.path, PathType.Exact, before, after);
            var newOp = {
                type: OperationType.Set,
                path: newPath,
                prop: op.prop,
                value: op.value
            };
            return newOp;
        }
    }
}
exports.map = map;
function transformPathAfterOperation(path, pathType, operation) {
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
exports.transformPathAfterOperation = transformPathAfterOperation;
function transformPathBeforeOperation(path, pathType, operation) {
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
exports.transformPathBeforeOperation = transformPathBeforeOperation;
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
function mapPathByTransformedOperation(path, pathType, opBefore, opAfter) {
    if (opBefore.type === OperationType.Insert
        && opAfter.type === OperationType.Insert
        && isAnchestorOrEqual(path, opBefore.path)) {
        var isEqual = path.length === opBefore.path.length;
        if (isEqual && pathType === PathType.Anchor) {
            throw new Error("Invalid path mapping");
        }
        return __spreadArray(__spreadArray([], opAfter.path, true), path.slice(opBefore.path.length), true);
    }
    throw new Error("Invalid path mapping");
}
exports.mapPathByTransformedOperation = mapPathByTransformedOperation;
function transformPathAfterInsert(path, pathType, insertAt) {
    if (!isParentAnchestorOfOther(insertAt, path)) {
        return path;
    }
    var lastPointer = insertAt.length - 1;
    if (path[lastPointer] < insertAt[lastPointer]) {
        return path;
    }
    if (path[lastPointer] > insertAt[lastPointer]) {
        var newPath = __spreadArray([], path, true);
        newPath[lastPointer] += 1;
        return newPath;
    }
    if (pathType === PathType.Exact) {
        var newPath = __spreadArray([], path, true);
        newPath[lastPointer] += 1;
        return newPath;
    }
    else {
        return path;
    }
}
function transformPathAfterDelete(path, pathType, deleteAt) {
    if (!isParentAnchestorOfOther(deleteAt, path)) {
        return path;
    }
    var lastPointer = deleteAt.length - 1;
    if (path[lastPointer] < deleteAt[lastPointer]) {
        return path;
    }
    if (path[lastPointer] > deleteAt[lastPointer]) {
        var newPath = __spreadArray([], path, true);
        newPath[lastPointer] -= 1;
        return newPath;
    }
    if (pathType === PathType.Exact) {
        return null;
    }
    else {
        return path;
    }
}
function transformPathAfterMove(path, pathType, from, to) {
    // The move transformation is a litle bit more complecated, but we can
    // simplify it by converting it into delete + insert transformation.
    // `from` and `to` is pointing to the same doc version.  We have to
    // transform (delete) `to` into `insertAt` so the insert operation points to
    // a doc that has been applied the delete operation.
    var insertPathAfterDelete = transformPathAfterDelete(to, PathType.Anchor, from);
    if (!insertPathAfterDelete) {
        return path;
    }
    var pathAfterDelete = transformPathAfterDelete(path, pathType, from);
    if (!pathAfterDelete) {
        return __spreadArray(__spreadArray([], insertPathAfterDelete, true), path.slice(from.length), true);
    }
    return transformPathAfterInsert(pathAfterDelete, pathType, insertPathAfterDelete);
}
function transformPathBeforeInsert(path, pathType, insertAt) {
    if (!isParentAnchestorOfOther(insertAt, path)) {
        return path;
    }
    var lastPointer = insertAt.length - 1;
    if (path[lastPointer] < insertAt[lastPointer]) {
        return path;
    }
    if (path[lastPointer] > insertAt[lastPointer]) {
        var newPath = __spreadArray([], path, true);
        newPath[lastPointer] -= 1;
        return newPath;
    }
    if (pathType === PathType.Exact) {
        return null;
    }
    else {
        return path;
    }
}
function transformPathBeforeDelete(path, pathType, deleteAt) {
    if (!isParentAnchestorOfOther(deleteAt, path)) {
        return path;
    }
    var lastPointer = deleteAt.length - 1;
    if (path[lastPointer] === deleteAt[lastPointer] && pathType === PathType.Anchor) {
        return path;
    }
    if (path[lastPointer] < deleteAt[lastPointer]) {
        return path;
    }
    var newPath = __spreadArray([], path, true);
    newPath[lastPointer] += 1;
    return newPath;
}
function transformPathBeforeMove(path, pathType, from, to) {
    var pathBeforeInsert = transformPathBeforeInsert(path, pathType, to);
    if (!pathBeforeInsert) {
        return from;
    }
    return transformPathBeforeDelete(pathBeforeInsert, pathType, from);
}
/**
 * Check if `path`'s parent is an anchestor of `other`.
 */
function isParentAnchestorOfOther(path, other) {
    if (path.length > other.length) {
        return false;
    }
    for (var i = 0; i < path.length - 1; i++) {
        if (path[i] !== other[i]) {
            return false;
        }
    }
    return true;
}
function isAnchestorOrEqual(path, other) {
    if (path.length >= other.length) {
        return false;
    }
    for (var i = 0; i < path.length; i++) {
        if (path[i] !== other[i]) {
            return false;
        }
    }
    return true;
}
