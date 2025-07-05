import express from 'express';
import { ValidationError, NotFoundError, BusinessLogicError, DatabaseError } from "../types/errors";
import { logger } from "../services/logger";
import taskRoutes from './routes/taskRoutes';
import workerRoutes from './routes/workerRoutes';
import { Request, Response, NextFunction } from 'express';

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/workers', workerRoutes);

// Error handling middleware (MUST be last!)
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("Error occurred:", error);

    if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message, field: error.field });
    } else if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
    } else if (error instanceof BusinessLogicError) {
        res.status(409).json({ error: error.message });
    } else if (error instanceof DatabaseError) {
        res.status(500).json({ error: "Internal server error" });
    } else {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default app;