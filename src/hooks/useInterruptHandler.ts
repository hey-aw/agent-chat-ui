import { useCallback, useMemo } from 'react';
import { LangGraphInterruptHandler } from '../lib/interrupts/LangGraphInterruptHandler';
import { AuthorizationInterrupt } from '../lib/interrupts/types';

interface UseInterruptHandlerOptions {
    /**
     * Function to display messages to the user
     */
    displayMessage: (message: string) => void;

    /**
     * Function to resume the workflow after successful authorization
     */
    resumeWorkflow: () => void;

    /**
     * Function to check if authorization is complete
     */
    checkAuthStatus: () => Promise<boolean>;

    /**
     * Timeout in milliseconds for waiting for authorization completion
     * @default 5 minutes
     */
    timeout?: number;

    /**
     * Polling interval in milliseconds for checking auth status
     * @default 2 seconds
     */
    pollInterval?: number;
}

/**
 * Hook for handling LangGraph authorization interrupts in React components
 */
export function useInterruptHandler(options: UseInterruptHandlerOptions) {
    const handler = useMemo(() => {
        return new LangGraphInterruptHandler(options);
    }, [options.displayMessage, options.resumeWorkflow, options.checkAuthStatus, options.timeout, options.pollInterval]);

    const handleInterrupt = useCallback(async (interrupt: AuthorizationInterrupt) => {
        try {
            await handler.handleAuthorizationInterrupt(interrupt);
        } catch (error) {
            // Re-throw the error to be handled by the component
            throw error;
        }
    }, [handler]);

    return {
        handleInterrupt,
    };
} 