import {
  LayoutDirection,
  LayoutElement,
  Path,
} from "doc";
import {Selection} from "@/lib/components/Tree";
import { ElementComponent } from "./ElementComponent";
import styles from "./LayoutComponent.module.css";

interface LayoutProps {
  data: LayoutElement,
  path: Path,
  selection: Selection,
  editable: boolean,
}

export function LayoutComponent(props: LayoutProps) {
  console.log("layout.props", props);
  const selected = props.selection && Object.keys(props.selection).length === 0;

  let className = styles.layout;

  if (props.data.direction === LayoutDirection.Row) {
    className = className + " " + styles.row;
  } else {
    className = className + " " + styles.column;
  }

  if (selected) {
    className = className + " " + styles.selected;
  }

  return (
    <div className={className}>
      {props.data.children.map((elm, i) => (
        <ElementComponent
          key={elm.id}
          path={[...props.path, i]}
          selection={props.selection && props.selection[i]}
          data={elm}
          editable={props.editable}
        />
      ))}
    </div>
  );
}
