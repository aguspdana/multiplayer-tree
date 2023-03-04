export interface Doc {
    id: string;
    type: DocType;
    title: string;
    content: Element[];
}
export declare enum DocType {
    Page = "page",
    Component = "component"
}
export type Element = LayoutElement | TextElement | InputElement | ButtonElement;
export declare enum ElementType {
    Layout = "layout",
    Text = "text",
    Input = "input",
    Button = "button"
}
interface LayoutElement {
    type: ElementType.Layout;
    direction: LayoutDirection;
    children: Element[];
}
export declare enum LayoutDirection {
    Row = "row",
    Column = "column"
}
export interface TextElement {
    type: ElementType.Text;
    text: string;
    fontSize: number;
}
export interface InputElement {
    type: ElementType.Input;
    placeholder: string;
    size: number;
}
export interface ButtonElement {
    type: ElementType.Button;
    text: string;
}
export type Transaction = Operation[];
export type Operation = InsertOperation | DeleteOperation | MoveOperation | SetOperation;
export declare enum OperationType {
    Insert = "insert",
    Delete = "delete",
    Move = "move",
    Set = "set"
}
export interface InsertOperation {
    type: OperationType.Insert;
    path: Path;
    element: Element;
}
export interface DeleteOperation {
    type: OperationType.Delete;
    path: Path;
}
export interface MoveOperation {
    type: OperationType.Move;
    from: Path;
    to: Path;
}
export interface SetOperation {
    type: OperationType.Set;
    path: Path;
    prop: string;
    value: any;
}
export type Path = number[];
export declare enum PathType {
    Exact = 0,
    Anchor = 1
}
export declare function applyOperation(content: Element[], operation: Operation): {
    content: Element[];
    undo: Operation;
} | null;
export declare function transformPathAfterOperation(path: Path, pathType: PathType, operation: Operation): Path | null;
export declare function transformPathBeforeOperation(path: Path, pathType: PathType, operation: Operation): Path | null;
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
export declare function mapPathByTransformedOperation(path: Path, opBefore: Operation, opAfter: Operation): Path;
export {};
