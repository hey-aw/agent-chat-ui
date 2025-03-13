import { useCallback } from 'react';
import { useStreamContext } from '@/providers/Stream';

export function useAuthStatus() {
    const stream = useStreamContext();

    const checkAuthStatus = useCallback(async (): Promise<boolean> => {
        try {
            // Get the current state from the stream
            const state = stream.getState();

            // Check if there are any tasks in the state
            if (!state.tasks || state.tasks.length === 0) {
                return true;
            }

            // Check if the authorization task is complete
            const authTask = state.tasks.find(task => task.name === 'authorization');
            if (!authTask) {
                return true;
            }

            // If the task has a result, it's complete
            if (authTask.result) {
                return true;
            }

            // If the task has an error, it failed
            if (authTask.error) {
                throw new Error(authTask.error);
            }

            // Otherwise, it's still in progress
            return false;
        } catch (error) {
            console.error('Error checking auth status:', error);
            throw error;
        }
    }, [stream]);

    return {
        checkAuthStatus,
    };
} 