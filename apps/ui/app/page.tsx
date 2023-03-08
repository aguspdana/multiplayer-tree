import styles from './page.module.css'
import { Builder } from "./Builder";

export default function Home() {
  return (
    <main className={styles.main}>
      <Builder/>
    </main>
  )
}
