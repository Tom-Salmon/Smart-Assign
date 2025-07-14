import { Request, Response, NextFunction } from "express";
import express from "express";
import { ValidationError, NotFoundError, BusinessLogicError, DatabaseError } from "../../types/errors";
import { logger } from '../../services/logger';
import {
    handleNewTask,
    deleteTask,
    getAllTasks,
    getTaskById,
    updateTask,
    finishTask,
    assignTaskToWorker,
    unassignTaskFromWorker,
} from "../../services/taskHandler";
import { sendNewTask, createNewWorker } from "../../kafka/kafkaProducer";

const router = express.Router();

// GET all tasks
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tasks = await getAllTasks();
        const response = {
            count: tasks.length,
            tasks: tasks,
            timestamp: new Date().toISOString()
        };
        res.json(response);
    } catch (error) {
        next(error);
    }
});

// GET task by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await getTaskById(req.params.id);
        if (!task) {
            throw new NotFoundError("Task not found", req.params.id);
        }
        res.json(task);
    } catch (error) {
        next(error);
    }
});

// POST create a new task with kafka and error handling
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Only send to Kafka - let the event handler create the task
        await sendNewTask(req.body);
        res.status(202).json({ message: "Task creation request submitted successfully" });
    } catch (error) {
        next(error);
    }
});

// PUT update a task
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedTask = await updateTask(req.params.id, req.body);
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
        await assignTaskToWorker(taskId, workerId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// POST unassign a task from a worker
router.post("/:taskId/unassign/:workerId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId, workerId } = req.params;
        await unassignTaskFromWorker(taskId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

// POST unassign a task from a worker
router.post("/:taskId/unassign", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;
        await unassignTaskFromWorker(taskId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});


// POST finish a task
router.post("/:taskId/finish", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;
        await finishTask(taskId);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});



// Error handling middleware
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("Error occurred:", error);
    if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
    } else if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
    } else if (error instanceof BusinessLogicError) {
        res.status(409).json({ message: error.message });
    } else if (error instanceof DatabaseError) {
        res.status(500).json({ message: "Internal server error" });
    } else {
        res.status(500).json({ message: "Unknown error occurred" });
    }
});
// Export the router
export { router as taskRoutes };