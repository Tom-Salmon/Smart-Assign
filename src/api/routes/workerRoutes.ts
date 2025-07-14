import { Request, Response, NextFunction } from "express";
import express from "express";
import { ValidationError, NotFoundError, BusinessLogicError, DatabaseError } from "../../types/errors";
import { logger } from '../../services/logger';
import {
    getAllWorkers,
    getWorkerById,
    updateWorker,
    deleteWorker
} from "../../services/workerHandler";
import { createNewWorker } from "../../kafka/kafkaProducer";
import { validateWorker } from "../../types/validation";

const router = express.Router();

// GET all workers
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workers = await getAllWorkers();
        const response = {
            count: workers.length,
            workers: workers,
            timestamp: new Date().toISOString()
        };
        res.json(response);
    } catch (error) {
        next(error);
    }
});

// GET worker by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const worker = await getWorkerById(req.params.id);
        if (!worker) {
            throw new NotFoundError("Worker not found", req.params.id);
        }
        res.json(worker);
    } catch (error) {
        next(error);
    }
});

// POST create a new worker via Kafka
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate the input
        validateWorker(req.body);
        await createNewWorker(req.body);
        res.status(202).json({ message: "Worker creation request submitted successfully" });
    } catch (error) {
        next(error);
    }
});

// PUT update a worker
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedWorker = await updateWorker(req.params.id, req.body);
        res.json(updatedWorker);
    } catch (error) {
        next(error);
    }
});

// DELETE a worker
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deleteWorker(req.params.id);
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
export { router as workerRoutes };
export default router;