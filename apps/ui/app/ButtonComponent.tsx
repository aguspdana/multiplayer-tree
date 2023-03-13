import {
  ButtonElement,
  Path,
} from "doc";
import {Selection} from "@/lib/components/Tree";
import styles from "./ButtonComponent.module.css";

interface ButtonProps {
  data: ButtonElement,
  path: Path,
  selection: Selection,
  editable: boolean,
}

export function ButtonComponent(props: ButtonProps) {
  const selected = props.selection && Object.keys(props.selection).length === 0;

  let className = styles.button;

  if (selected) {
    className = className + " " + styles.selected;
  }

  return (
    <button className={className}>{props.data.text}</button>
  );
}
