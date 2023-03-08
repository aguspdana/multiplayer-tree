export type ProcessFn<T> = (job: T) => Promise<void> | void;
export declare class Queue<T> {
    private head;
    private tail;
    private jobs;
    private process;
    private processing;
    constructor(process: ProcessFn<T>);
    addJob(job: T): void;
    private enqueue;
    private dequeue;
    get length(): number;
    get isEmpty(): boolean;
}
