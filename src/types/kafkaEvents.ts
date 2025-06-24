import { Task, Worker } from './entities';
import { Kafka } from 'kafkajs';

type newTask = {
    type: "NEW_TASK";
    payload: Task;
}
type workerStatusUpdate = {
    type: "WORKER_STATUS_UPDATE";
    payload: Worker;
}
export type KafkaEvent = newTask | workerStatusUpdate;