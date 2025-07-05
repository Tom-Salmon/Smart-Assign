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
        res.json(workers);
    } catch (error) {
        next(error);
    }
});

// GET worker by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const worker = await getWorkerById(req.params.id);
        if (!worker) {
            throw new NotFoundError("Worker", req.params.id);
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

        // Send to Kafka for async processing
        await createNewWorker(req.body);

        // Return accepted status (202) - processing will happen asynchronously
        res.status(202).json({
            message: "Worker creation initiated",
            status: "processing"
        });
    } catch (error) {
        next(error);
    }
});

// PUT update a worker
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate the input (partial validation for updates)
        if (Object.keys(req.body).length === 0) {
            throw new ValidationError("Request body cannot be empty");
        }

        const updatedWorker = await updateWorker(req.params.id, req.body);
        if (!updatedWorker) {
            throw new NotFoundError("Worker", req.params.id);
        }
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
export default router;