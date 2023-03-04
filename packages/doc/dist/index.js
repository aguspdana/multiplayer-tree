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
exports.mapPathByTransformedOperation = exports.transformPathBeforeOperation = exports.transformPathAfterOperation = exports.applyOperation = exports.PathType = exports.OperationType = exports.LayoutDirection = exports.ElementType = exports.DocType = void 0;
var DocType;
(function (DocType) {
    DocType["Page"] = "page";
    DocType["Component"] = "component";
})(DocType = exports.DocType || (exports.DocType = {}));
var ElementType;
(function (ElementType) {
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
function applyOperation(content, operation) {
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
exports.applyOperation = applyOperation;
function applyInsert(content, operation) {
    var newContent = apply(content, operation.path, function (children, index) {
        if (index < 0 || index > children.length) {
            return false;
        }
        children.splice(index, 0, operation.element);
        return true;
    });
    if (!newContent) {
        return null;
    }
    return {
        content: newContent,
        undo: {
            type: OperationType.Delete,
            path: __spreadArray([], operation.path, true)
        }
    };
}
function applyDelete(content, operation) {
    var deleted;
    var newContent = apply(content, operation.path, function (children, index) {
        if (index < 0 || index >= children.length) {
            return false;
        }
        deleted = children.splice(index, 1)[0];
        return true;
    });
    if (!newContent || !deleted) {
        return null;
    }
    return {
        content: newContent,
        undo: {
            type: OperationType.Insert,
            path: __spreadArray([], operation.path, true),
            element: deleted
        }
    };
}
function applyMove(content, operation) {
    var deleteOp = {
        type: OperationType.Delete,
        path: operation.from
    };
    var insertAt = transformPathAfterDelete(operation.to, PathType.Anchor, operation.from);
    if (!insertAt) {
        return null;
    }
    var deleteRes = applyDelete(content, deleteOp);
    if (!deleteRes) {
        return null;
    }
    var insertOp = {
        type: OperationType.Insert,
        path: insertAt,
        element: deleteRes.undo.element
    };
    var insertRes = applyInsert(deleteRes.content, insertOp);
    if (!insertRes) {
        return null;
    }
    var undoTo = transformPathAfterInsert(operation.from, PathType.Anchor, insertAt);
    return {
        content: insertRes.content,
        undo: {
            type: OperationType.Move,
            from: insertAt,
            to: undoTo
        }
    };
}
function applySet(content, operation) {
    var replacedValue;
    var newContent = apply(content, operation.path, function (parentChildren, index) {
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
    if (!newContent) {
        return null;
    }
    return {
        content: newContent,
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
function mapPathByTransformedOperation(path, opBefore, opAfter) {
    if (opBefore.type === OperationType.Insert
        && opAfter.type === OperationType.Insert
        && arePathsEqual(path, opBefore.path)) {
        return opAfter.path;
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
        return __spreadArray(__spreadArray([], to, true), path.slice(from.length), true);
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
    var deletePathBeforeInsert = transformPathBeforeInsert(from, PathType.Anchor, to);
    if (!deletePathBeforeInsert) {
        return path;
    }
    var pathBeforeInsert = transformPathBeforeInsert(path, pathType, from);
    if (!pathBeforeInsert) {
        return from;
    }
    return transformPathBeforeDelete(pathBeforeInsert, pathType, deletePathBeforeInsert);
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
function arePathsEqual(path, other) {
    if (path.length !== other.length) {
        return false;
    }
    for (var i = 0; i < path.length; i++) {
        if (path[i] !== other[i]) {
            return false;
        }
    }
    return true;
}
