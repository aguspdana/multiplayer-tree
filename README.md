# Setup

Install dependencies.

```
npm run install
```
Run the server.

```
cd apps/server
npm run dev
```
Run the front-end.

```
cd apps/ui
npm run dev
```

# Front-end

Routes:
- `/` Main demo (multiplayer)
- `/tree` Basic tree component

The tree component behaves similar to Figma layers tree with some differences.

- `Click` to select a node exclusively
- `Ctrl + Click` to select/unselect a node
- It can move multiple nodes
- Highlight the parent node of the drop position when moving the node.

Figma determines the drop position based on the mouse position.  This allows it
to move a node to the parent level (as sibling) when dragged slightly to
the left.  I can't recreate this without causing expensive browser reflows
because the specification of this exercise is to support custom component for
the node, which can have different dimensions.  As a workaround, we can move
a node as the parent sibling when the mouse is hovered over the parent
component, outside the child component.

## Page/component renference

The data model of the front-end is roughly like this

```typescript
Interface State {
  ...
  docs: {
    [id: string]: Doc
  },
  openDocId: string
  ...
}
```

The active doc and the referenced page/component docs is stored under docs.
The active doc is marked as `openDocId`.  We subscribe to changes
(remote operations) on all docs instead of only the active doc.

# Realtime collaboration

Most SAAS apps will support realtime collaboration, because using a lock has
bad UX.  So I added realtime collaboration powered by Operational
Transformation (OT) in this demo.  It has four basic operations:

- Insert a node
- Delete a node
- Move a node
- Set a node property

These operations are designed specifically for this use case.  But we can make
a generic OT package that can be used for *any* data model.  I've written a
[generic OT library](https://github.com/aguspdana/polda/tree/main/ot) in Rust
(though not finished yet).  It supports more complicated operations:

- Insert a range of nodes
- Delete a range of nodes
- Move a node
- Insert a range of characters
- Delete a range of characters
- Set a node property
- Increment a number property
- Decrement a number property

The most important capabilitiy of OT is that it can enforce certain rules,
which I believe other algorithms like CRDT lack of or very hard to implement.
In this usecase we can prevent a node from being a parent/anchestor of itself.

# Schema

The schema and the test queries are located under `apps/server/tests`.

![Schema](https://github.com/aguspdana/multiplayer-tree/blob/main/assets/schema.png?raw=true)

With this schema we have a few guarantees:

- `Doc` (`PageDoc` and `ComponentDoc`) can have multiple children but can't be
a child.
- Some elements (e.g. `TextElement`) can only be a child or a leaf.
- `LayoutElement` can be a parent and a child.

Though TypeDB can't enforce a rule that prevent a node from being a parent and
a child of itself or being an anchestor of itself. This can cause circular
dependencies, which is not a valid tree.

If Blitz will implement realtime collaboration, I'd recommend to use a document
DB like DynamoDB, which is what Figma uses.  This way the application is
responsible to ensure the doc to be valid and the doc in the database can be
updated in a single transaction.

# TODO

This demo requires a perfect connection.  It doesn't handle message dropped
because of bad connection, which can cause inconsistent document across
different clients.
