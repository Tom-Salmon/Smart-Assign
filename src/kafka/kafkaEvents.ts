import { Task, Worker } from '../types/entities';

type newTask = {
    type: "NEW_TASK";
    payload: Task;
}

type newWorker = {
    type: "NEW_WORKER";
    payload: Worker;
}

export type KafkaEvent = newTask | newWorker;