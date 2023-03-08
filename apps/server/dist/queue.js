"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue {
    constructor(process) {
        this.jobs = {};
        this.head = 0;
        this.tail = 0;
        this.processing = false;
        this.process = function (job) {
            return __awaiter(this, void 0, void 0, function* () {
                this.processing = true;
                yield process(job);
                const nextJob = this.dequeue();
                if (nextJob !== undefined) {
                    this.process(nextJob);
                }
                else {
                    this.processing = false;
                }
            });
        };
    }
    addJob(job) {
        if (this.isEmpty && !this.processing) {
            this.process(job);
        }
        else {
            this.enqueue(job);
        }
    }
    enqueue(job) {
        this.jobs[this.tail] = job;
        this.tail++;
    }
    dequeue() {
        const item = this.jobs[this.head];
        delete this.jobs[this.head];
        this.head++;
        return item;
    }
    get length() {
        return this.tail - this.head;
    }
    get isEmpty() {
        return this.length === 0;
    }
}
exports.Queue = Queue;
