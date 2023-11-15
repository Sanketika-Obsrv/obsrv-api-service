declare namespace Express {
    export interface Request {
        auditEvent: Record<string, any>
    }
}