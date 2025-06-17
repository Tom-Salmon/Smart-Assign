import { Task, Assignment, Worker } from './entities';
import { Kafka } from 'kafkajs';

type newTask = {
    type: "NEW_TASK";
    payload: Task;
}
type workerStatusUpdate = {
    type: "WORKER_STATUS_UPDATE";
    payload: Worker;
}
type taskAssign = {
    type: "TASK_ASSIGN";
    payload: Assignment;
}

export type KafkaEvent = newTask | workerStatusUpdate | taskAssign;