import {
  Doc,
  DocType,
  ElementType,
  LayoutDirection,
} from "doc";

export const docs: Doc[] = [
  {
    id: "page-1",
    type: DocType.Page,
    title: "Example",
    children: [
      {
        id: "layout-1",
        type: ElementType.Layout,
        name: "Layout 1",
        direction: LayoutDirection.Row,
        children: [
          {
            id: "text-1",
            type: ElementType.Text,
            name: "Text 1",
            text: "Hello Text 1",
            fontSize: 16
          },
          {
            id: "text-2",
            type: ElementType.Text,
            name: "Text 2",
            text: "Hello Text 2",
            fontSize: 16
          },
          {
            id: "text-3",
            type: ElementType.Text,
            name: "Text 3",
            text: "Hello Text 3",
            fontSize: 16
          }
        ]
      },
      {
        id: "layout-2",
        type: ElementType.Layout,
        name: "Layout 2",
        direction: LayoutDirection.Column,
        children: [
          {
            id: "text-4",
            type: ElementType.Text,
            name: "Text 4",
            text: "Hello Text 4",
            fontSize: 16
          },
          {
            id: "text-5",
            type: ElementType.Text,
            name: "Text 5",
            text: "Hello Text 5",
            fontSize: 16
          },
          {
            id: "text-6",
            type: ElementType.Text,
            name: "Text 6",
            text: "Hello Text 6",
            fontSize: 16
          }
        ]
      },
      {
        id: "comp-ref-1",
        type: ElementType.ComponentRef,
        name: "Login form",
        docId: "comp-1",
      },
    ]
  },
  {
    type: DocType.Component,
    id: "comp-1",
    title: "Login form",
    children: [
      {
        type: ElementType.Input,
        id: "comp1-input-1",
        name: "Input.Email",
        placeholder: "Email",
      },
      {
        type: ElementType.Input,
        id: "comp-1-input-1",
        name: "Input.Password",
        placeholder: "Password",
      },
      {
        type: ElementType.Button,
        id: "comp-1-input-2",
        name: "Button.Login",
        text: "Login",
      },
    ],
  },
];
