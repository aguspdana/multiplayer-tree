import {
  Element,
  ElementType,
  Path,
} from "doc";
import {Selection} from "@/lib/components/Tree";
import { ButtonComponent } from "./ButtonComponent";
import { ComponentRefComponent } from "./ComponentRefComponent";
import { InputComponent } from "./InputComponent";
import { LayoutComponent } from "./LayoutComponent";
import { TextComponent } from "./TextComponent";

interface ElementProps {
  data: Element,
  path: Path,
  selection: Selection,
  editable: boolean,
}

export function ElementComponent(props: ElementProps) {
  switch (props.data.type) {
    case ElementType.Layout:
      return (
        <LayoutComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
          editable={props.editable}
        />
      );
    case ElementType.Text:
      return (
        <TextComponent
          path={props.path}
          data={props.data}
          selection={props.selection}
          editable={props.editable}
        />)
      ;
    case ElementType.Input:
      return (
        <InputComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
          editable={props.editable}
        />
      );
    case ElementType.Button:
      return (
        <ButtonComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
          editable={props.editable}
        />
      );
    case ElementType.ComponentRef:
      return (
        <ComponentRefComponent
          path={props.path}
          selection={props.selection}
          data={props.data}
          editable={props.editable}
        />
      );
  }
}
