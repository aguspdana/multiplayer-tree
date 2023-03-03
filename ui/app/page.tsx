import { TreeExample } from "lib/components/TreeExample";
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <TreeExample/>
    </main>
  )
}
