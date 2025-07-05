// Custom error types for better error handling
export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(resource: string, id: string) {
        super(`${resource} with ID ${id} not found`);
        this.name = 'NotFoundError';
    }
}

export class BusinessLogicError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BusinessLogicError';
    }
}

export class DatabaseError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'DatabaseError';
    }
}

// Result pattern for better error handling
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

export function createSuccessResult<T>(data: T): Result<T> {
    return { success: true, data };
}

export function createErrorResult<E extends Error>(error: E): Result<never, E> {
    return { success: false, error };
}
