import { AuthorizationInterrupt, InterruptHandler, AuthorizationError, AuthorizationTimeoutError, InvalidAuthUrlError } from './types';

interface LangGraphInterruptHandlerOptions {
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
     * Function to validate the auth URL before opening it
     * @default undefined - no validation
     */
    validateAuthUrl?: (url: string) => boolean;

    /**
     * Function to open the auth URL
     * @default undefined - will use window.location.href
     */
    openAuthUrl?: (url: string) => void;
}

/**
 * Implementation of the interrupt handler for LangGraph authorization interrupts
 */
export class LangGraphInterruptHandler implements InterruptHandler {
    private readonly timeout: number;
    private readonly pollInterval: number;
    private readonly displayMessage: (message: string) => void;
    private readonly resumeWorkflow: () => void;
    private readonly checkAuthStatus: () => Promise<boolean>;
    private readonly validateAuthUrl?: (url: string) => boolean;
    private readonly openAuthUrl: (url: string) => void;

    constructor(options: LangGraphInterruptHandlerOptions) {
        this.timeout = options.timeout ?? 5 * 60 * 1000; // 5 minutes
        this.pollInterval = options.pollInterval ?? 2000; // 2 seconds
        this.displayMessage = options.displayMessage;
        this.resumeWorkflow = options.resumeWorkflow;
        this.checkAuthStatus = options.checkAuthStatus;
        this.validateAuthUrl = options.validateAuthUrl;
        this.openAuthUrl = options.openAuthUrl ?? ((url: string) => {
            window.location.href = url;
        });
    }

    async handleAuthorizationInterrupt(interrupt: AuthorizationInterrupt): Promise<void> {
        try {
            // 1. Validate the auth URL if a validator is provided
            if (this.validateAuthUrl && !this.validateAuthUrl(interrupt.auth_url)) {
                throw new InvalidAuthUrlError();
            }

            // 2. Display the authorization message
            this.displayMessage(interrupt.message);

            // 3. Open the authorization URL
            this.openAuthUrl(interrupt.auth_url);

            // 4. Wait for authorization to complete
            await this.waitForAuthCompletion();

            // 5. Resume the workflow
            this.resumeWorkflow();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                throw error;
            }
            throw new AuthorizationError('Failed to handle authorization interrupt', error);
        }
    }

    private async waitForAuthCompletion(): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < this.timeout) {
            try {
                const isComplete = await this.checkAuthStatus();
                if (isComplete) {
                    return;
                }
            } catch (error) {
                throw new AuthorizationError('Failed to check authorization status', error);
            }

            await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        }

        throw new AuthorizationTimeoutError();
    }
} 