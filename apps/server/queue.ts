export type ProcessFn<T> = (job: T) => Promise<void> | void;

export class Queue<T> {
  private head: number;
  private tail: number;
  private jobs: { [i: number]: T };
  private process: ProcessFn<T>;
  private processing: boolean;

  constructor(process: ProcessFn<T>) {
    this.jobs = {};
    this.head = 0;
    this.tail = 0;
    this.processing = false;

    this.process = async function (job: T) {
      this.processing = true;
      await process(job);
      const nextJob = this.dequeue();
      if (nextJob !== undefined) {
        this.process(nextJob);
      } else {
        this.processing = false;
      }
    }
  }

  addJob(job: T) {
    if (this.isEmpty && !this.processing) {
      this.process(job);
    } else {
      this.enqueue(job);
    }
  }

  private enqueue(job: T) {
    this.jobs[this.tail] = job;
    this.tail++;
  }

  private dequeue(): T | undefined {
    const item = this.jobs[this.head];
    delete this.jobs[this.head];
    this.head++;
    return item;
  }

  get length(): number {
    return this.tail - this.head;
  }

  get isEmpty(): boolean {
    return this.length === 0;
  }
}
