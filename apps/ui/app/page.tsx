import styles from './page.module.css'
import { Chat } from "./Chat";

export default function Home() {
  return (
    <main className={styles.main}>
      <Chat/>
    </main>
  )
}
