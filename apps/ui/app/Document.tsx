"use client";

import {Selection} from "@/lib/components/Tree";
import {
  ButtonElement,
  ComponentRefElement,
  Element,
  ElementType,
  InputElement,
  LayoutElement,
  Path,
  TextElement,
} from "doc";
import { useStore } from "./store";
import styles from "./Document.module.css";

export function Document() {
  const doc = useStore(state => state.openDocId && state.docs[state.openDocId]);
  const selection = useStore(state => state.openDocId && state.docs[state.openDocId]);

  if (!doc) {
    return null;
  }

  return (
    <div className={styles.container}>
      {doc.doc.children.map(elm => (
        <ElementComponent
          key={elm.id}
          path={[]}
          selection={doc.selection}
          data={elm}
        />
      ))}
    </div>
  );
}

interface ComponentProps {
  path: Path,
  selection?: Selection,
}

interface ElementProps extends ComponentProps {
  data: Element,
}

export function ElementComponent(props: ElementProps) {
  switch (props.data.type) {
    case ElementType.Layout:
      return (
        <LayoutComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
        />
      );
    case ElementType.Text:
      return (
        <TextComponent
          path={props.path}
          data={props.data}
          selection={props.selection}
        />)
      ;
    case ElementType.Input:
      return (
        <InputComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
        />
      );
    case ElementType.Button:
      return (
        <ButtonComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
        />
      );
    case ElementType.ComponentRef:
      return (
        <ComponentRefComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
        />
      );
  }
}

interface LayoutProps extends ComponentProps {
  data: LayoutElement,
}

export function LayoutComponent(props: LayoutProps) {
  return (
    <div>
      {props.data.children.map((elm, i) => (
        <ElementComponent
          key={elm.id}
          path={[...props.path, i]}
          selection={props.selection && props.selection[i]}
          data={elm}
        />
      ))}
    </div>
  );
}

interface TextProps extends ComponentProps {
  data: TextElement,
}

export function TextComponent(props: TextProps) {
  return (
    <div>{props.data.text}</div>
  );
}

interface InputProps extends ComponentProps {
  data: InputElement,
}

export function InputComponent(props: InputProps) {
  return (
    <input value={props.data.placeholder} />
  );
}

interface ButtonProps extends ComponentProps {
  data: ButtonElement,
}

export function ButtonComponent(props: ButtonProps) {
  return (
    <button>{props.data.text}</button>
  );
}

interface ComponentRefProps extends ComponentProps {
  data: ComponentRefElement,
}

export function ComponentRefComponent(props: ComponentRefProps) {
  return (
    <div></div>
  );
}
