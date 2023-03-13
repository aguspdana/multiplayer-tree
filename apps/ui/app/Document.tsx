"use client";

import { Selection } from "@/lib/components/Tree";
import {
  Doc,
} from "doc";
import styles from "./Document.module.css";
import { ElementComponent } from "./ElementComponent";

interface DocumentProps {
  doc: Doc,
  selection: Selection,
  editable: boolean,
}

export function Document(props: DocumentProps) {
  return (
    <div className={styles.document}>
      {props.doc.children.map((elm, i) => (
        <ElementComponent
          key={elm.id}
          path={[i]}
          selection={props.selection[i]}
          data={elm}
          editable={props.editable}
        />
      ))}
    </div>
  );
}

