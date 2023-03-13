import {
  Path,
  TextElement,
} from "doc";
import {Selection} from "@/lib/components/Tree";
import styles from "./TextComponent.module.css";

interface TextProps {
  data: TextElement,
  path: Path,
  selection: Selection,
  editable: boolean,
}

export function TextComponent(props: TextProps) {
  const selected = props.selection && Object.keys(props.selection).length === 0;

  let className = styles.text;

  if (selected) {
    className = className + " " + styles.selected;
  }

  return (
    <div className={className}>{props.data.text}</div>
  );
}
