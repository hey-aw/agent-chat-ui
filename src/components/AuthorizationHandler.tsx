import React, { useState } from 'react';
import { useInterruptHandler } from '../hooks/useInterruptHandler';
import { AuthorizationInterrupt, AuthorizationError, InvalidAuthUrlError } from '../lib/interrupts/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AuthorizationHandlerProps {
    onResume: () => void;
    checkAuthStatus: () => Promise<boolean>;
    interrupt?: AuthorizationInterrupt;
    validateAuthUrl?: (url: string) => boolean;
}

export function AuthorizationHandler({ onResume, checkAuthStatus, interrupt, validateAuthUrl }: AuthorizationHandlerProps) {
    const [error, setError] = useState<Error | null>(null);
    const [isAuthorizing, setIsAuthorizing] = useState(false);

    const { handleInterrupt } = useInterruptHandler({
        displayMessage: (message) => {
            toast.info(message, {
                duration: 10000,
                richColors: true,
                closeButton: true,
            });
        },
        resumeWorkflow: onResume,
        checkAuthStatus,
        validateAuthUrl,
        openAuthUrl: (url) => {
            // We'll handle the URL opening in the onClick handler
            return url;
        },
        timeout: 5 * 60 * 1000, // 5 minutes
        pollInterval: 2000, // 2 seconds
    });

    const handleAuthorize = async (interrupt: AuthorizationInterrupt) => {
        try {
            setError(null);
            setIsAuthorizing(true);

            // Start the authorization process
            await handleInterrupt(interrupt);

            // Open the URL in a new tab
            window.open(interrupt.auth_url, '_blank');

            // Resume the workflow
            onResume();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error occurred');
            setError(error);

            if (error instanceof InvalidAuthUrlError) {
                toast.error('Invalid Authorization URL', {
                    description: 'The authorization URL is invalid or unsafe.',
                    richColors: true,
                    closeButton: true,
                });
            } else if (error instanceof AuthorizationError) {
                toast.error('Authorization Failed', {
                    description: error.message,
                    richColors: true,
                    closeButton: true,
                });
            } else {
                toast.error('Unknown Error', {
                    description: 'An unexpected error occurred during authorization.',
                    richColors: true,
                    closeButton: true,
                });
            }
            setIsAuthorizing(false);
        }
    };

    if (!interrupt) {
        return null;
    }

    // Extract the URL from the message and replace it with a clickable link
    const messageWithLink = interrupt.message.replace(
        interrupt.auth_url,
        `[Authorize](${interrupt.auth_url})`
    );

    return (
        <Card className="p-4 mt-4 bg-muted/50">
            <div className="flex flex-col gap-4">
                <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                        components={{
                            a: ({ node, ...props }) => (
                                <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                />
                            ),
                        }}
                    >
                        {messageWithLink}
                    </ReactMarkdown>
                </div>
                {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                        {error.message}
                    </div>
                )}
                <div className="flex flex-row gap-2">
                    <Button
                        variant="destructive"
                        onClick={() => onResume()}
                        disabled={isAuthorizing}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Card>
    );
} 