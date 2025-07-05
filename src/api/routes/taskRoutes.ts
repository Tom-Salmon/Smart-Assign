import { Request, Response, NextFunction } from "express";
import express from "express";
import { ValidationError, NotFoundError, BusinessLogicError, DatabaseError } from "../../types/errors";
import { logger } from '../../services/logger';
import {
    deleteTask,
    getAllTasks,
    getTaskById,
    updateTask,
    finishTask,
    assignTaskToWorker,
    unassignTaskFromWorker,
} from "../../services/taskHandler";
import { sendNewTask } from "../../kafka/kafkaProducer";
import { validateTask } from "../../types/validation";

const router = express.Router();

// GET all tasks
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tasks = await getAllTasks();
        res.json(tasks);
    } catch (error) {
        next(error);
    }
});

// GET task by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await getTaskById(req.params.id);
        if (!task) {
            throw new NotFoundError("Task", req.params.id);
        }
        res.json(task);
    } catch (error) {
        next(error);
    }
});

// POST create a new task via Kafka
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate the input
        validateTask(req.body);

        // Send to Kafka for async processing
        await sendNewTask(req.body);

        // Return accepted status (202) - processing will happen asynchronously
        res.status(202).json({
            message: "Task creation initiated",
            status: "processing"
        });
    } catch (error) {
        next(error);
    }
});

// PUT update a task
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate the input (partial validation for updates)
        if (Object.keys(req.body).length === 0) {
            throw new ValidationError("Request body cannot be empty");
        }

        const updatedTask = await updateTask(req.params.id, req.body);
        if (!updatedTask) {
            throw new NotFoundError("Task", req.params.id);
        }
        res.json(updatedTask);
    } catch (error) {
        next(error);
    }
});

// DELETE a task
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deleteTask(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// POST assign a task to a worker
router.post("/:taskId/assign/:workerId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId, workerId } = req.params;

        // Validate parameters
        if (!taskId || !workerId) {
            throw new ValidationError("Both taskId and workerId are required");
        }

        await assignTaskToWorker(taskId, workerId);
        res.status(200).json({ message: "Task assigned successfully" });
    } catch (error) {
        next(error);
    }
});

// POST unassign a task from a worker
router.post("/:taskId/unassign", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;

        // Validate parameters
        if (!taskId) {
            throw new ValidationError("TaskId is required");
        }

        await unassignTaskFromWorker(taskId);
        res.status(200).json({ message: "Task unassigned successfully" });
    } catch (error) {
        next(error);
    }
});

// POST finish a task
router.post("/:taskId/finish", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;

        // Validate parameters
        if (!taskId) {
            throw new ValidationError("TaskId is required");
        }

        await finishTask(taskId);
        res.status(200).json({ message: "Task finished successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;