/**
 * Represents an authorization interrupt from the LangGraph workflow
 */
export interface AuthorizationInterrupt {
    message: string;      // Message to display to the user
    auth_url: string;     // URL the user needs to visit
    type: "authorization"; // Literal type identifier
}

/**
 * Interface for handling authorization interrupts
 */
export interface InterruptHandler {
    /**
     * Handles an authorization interrupt from the LangGraph workflow
     * 
     * @param interrupt The authorization interrupt data
     * @returns Promise<void> Resolves when authorization is complete
     */
    handleAuthorizationInterrupt(interrupt: AuthorizationInterrupt): Promise<void>;
}

/**
 * Error thrown when authorization fails
 */
export class AuthorizationError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

/**
 * Error thrown when authorization times out
 */
export class AuthorizationTimeoutError extends AuthorizationError {
    constructor(message = 'Authorization timed out') {
        super(message);
        this.name = 'AuthorizationTimeoutError';
    }
}

/**
 * Error thrown when the auth URL is invalid
 */
export class InvalidAuthUrlError extends AuthorizationError {
    constructor(message = 'Invalid authorization URL') {
        super(message);
        this.name = 'InvalidAuthUrlError';
    }
} 