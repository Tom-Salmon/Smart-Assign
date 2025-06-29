import { Task, Worker } from './entities';
import { Kafka } from 'kafkajs';

type newTask = {
    type: "NEW_TASK";
    payload: Task;
}
type newWorker = {
    type: "NEW_WORKER";
    payload: Worker;
}
export type KafkaEvent = newTask | newWorker;