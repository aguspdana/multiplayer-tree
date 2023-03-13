import {
  InputElement,
  Path,
} from "doc";
import { Selection } from "@/lib/components/Tree";
import styles from "./InputComponent.module.css";

interface InputProps  {
  data: InputElement,
  path: Path,
  selection: Selection,
  editable: boolean,
}

export function InputComponent(props: InputProps) {
  const selected = props.selection && Object.keys(props.selection).length === 0;

  let className = styles.input;

  if (selected) {
    className = className + " " + styles.selected;
  }

  return (
    <input
      className={className}
      value={props.data.placeholder}
    />
  );
}
