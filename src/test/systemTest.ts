import { connectToMongoDB } from "../models/mongoClient";
import { deleteTask, getAllTasks, getTaskById, updateTask, finishTask, assignTaskToWorker, unassignTaskFromWorker } from "../services/taskHandler";
import { deleteWorker, getAllWorkers, getWorkerById, updateWorker } from "../services/workerHandler";
import { Worker } from "../types/entities";
import { Task } from "../types/entities";
import { logger } from "../services/logger";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
(async () => {
    try {

        // Fetch all workers
        const workers = await getAllWorkers();
        logger.info("Fetched all workers:", workers);

        // Fetch all tasks
        const tasks = await getAllTasks();
        logger.info("Fetched all tasks:", tasks);

        // Fetch a worker by ID
        const workerId = workers.length > 0 ? workers[0].id : "";
        const worker = await getWorkerById(workerId);
        logger.info("Fetched worker by ID:", worker);

        // Fetch a task by ID
        const taskId = tasks.length > 0 ? tasks[0].id : "";
        const task = await getTaskById(taskId);
        logger.info("Fetched task by ID:", task);

        // Update a worker
        if (worker) {
            const updatedWorker: Worker = {
                ...worker,
                currentLoad: worker.currentLoad + 5,
            };
            await updateWorker(worker.id, updatedWorker);
            logger.info("Updated worker:", updatedWorker);
        }

        // Update a task
        if (task) {
            const updatedTask: Task = {
                ...task,
                load: task.load + 5,
            };
            await updateTask(task.id, updatedTask);
            logger.info("Updated task:", updatedTask);
        }
        logger.info("Trying to assign and unassign tasks...");
        // Assign a task to a worker
        if (worker && task) {
            try {
                await assignTaskToWorker(task.id, worker.id);
                logger.info(`Assigned task ${task.id} to worker ${worker.id}`);
                await sleep(1000);
            } catch (error) {
            }

            // Unassign a task from a worker
            if (worker && task) {
                await unassignTaskFromWorker(task.id);
                logger.info(`Unassigned task ${task.id} from worker ${worker.id}`);
            }
            // Finish a task
            if (task) {
                await finishTask(task.id);
                logger.info(`Finished task ${task.id}`);
            }
            // Delete a worker
            if (worker) {
                await deleteWorker(worker.id);
                logger.info(`Deleted worker ${worker.id}`);
            }
            // Delete a task
            if (task) {
                await deleteTask(task.id);
                logger.info(`Deleted task ${task.id}`);
            }
            // Wait for a while to ensure all operations are completed
            await sleep(2000);
            logger.info("All operations completed successfully");
        } else {
            logger.error("No worker or task available for assignment/unassignment");
        }
    } catch (error) {
        logger.error("Error in system test:", error);
    }
})().catch(logger.error);