"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const bee_queue_1 = __importDefault(require("bee-queue"));
const io = new socket_io_1.Server(3001, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});
const queue = new bee_queue_1.default("example");
const job = queue.createJob({ x: 2, y: 3 });
job.save();
queue.process(function (job, done) {
    console.log(`Processing job ${job.id} => x = ${job.data.x}; y = ${job.data.y}`);
    return done(null, job.data.x + job.data.y);
});
io.to("").emit("");
io.on("connection", (socket) => {
    console.log("Connected");
    // - Client requests available pages/components
    // - Client ubscribes to a page/component
    //   - Server sends the latest version
    // - Client creates a new page/component
    // - Client deletes a page/component
    //   - Server broadcasts a delete-page-component event
    // - Client sends transaction
    // - Server broadcasts transaction
    // - Client unsibscribes to a page/component
});
