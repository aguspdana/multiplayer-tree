import {
  ComponentRefElement,
  Path,
} from "doc";
import {Selection} from "@/lib/components/Tree";
import {useStore} from "./store";
import {Document} from "./Document";
import styles from "./ComponentRefComponent.module.css";

interface ComponentRefProps {
  data: ComponentRefElement,
  path: Path,
  selection: Selection,
  editable: boolean,
}

export function ComponentRefComponent(props: ComponentRefProps) {
  const doc = useStore(state => state.docs[props.data.docId]);

  if (!doc) {
    return null;
  }

  const selected = props.selection && Object.keys(props.selection).length === 0;

  let className = styles.component_ref;

  if (selected) {
    className = className + " " + styles.selected;
  }

  return (
    <div className={className}>
      <Document
        doc={doc.doc}
        selection={{}}
        editable={false}
      />
    </div>
  );
}
