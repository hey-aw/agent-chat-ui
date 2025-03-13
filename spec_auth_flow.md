# Simple Authorization Handler Specification

## Overview

This specification defines the basic behavior for handling the initial authorization request in the LangGraph workflow. It focuses on the core functionality of displaying the authorization UI, starting the authorization process, and handling the Command pattern for state transitions.

## Component Structure

### Core Components

1. **AuthorizationHandler**
   - Simple component for displaying initial authorization UI
   - Handles basic user interaction
   - Manages authorization state
   - Sends Commands to LangGraph workflow

### Type Definitions

```typescript
interface AuthorizationData {
  message: string;
  auth_url: string;
  type: "authorization";
  command: "wait_for_auth";
}

interface LangGraphCommand<T extends string> {
  update?: Record<string, any>;
  goto?: T;
  resume?: any;
  graph?: Command.PARENT;
}

interface AuthorizationCommand
  extends LangGraphCommand<"wait_for_auth" | "tools"> {
  update: {
    messages: Array<{
      content: string;
      type: "ai" | "human" | "tool";
      tool_call_id?: string;
    }>;
  };
}
```

## Scenario: Initial Authorization Request

### Given

- User initiates an action requiring authorization
- LangGraph workflow detects need for authorization
- Interrupt data is received with auth URL

### When

- Component receives interrupt data
- User clicks "Start Authorization"

### Then

- Component should:

  1. Display authorization card with:
     - Warning alert
     - Authorization message
     - Start Authorization button
  2. Open auth URL in new window
  3. Update UI to show "Complete Authorization" button
  4. Send Command to LangGraph:

     ```typescript
     {
       goto: 'wait_for_auth',
       update: {
         messages: [
           {
             content: "I'll wait while you complete the authorization...",
             type: 'ai'
           }
         ]
       },
       data: {
         message: `Visit the following URL to authorize: ${interruptData.auth_url}`,
         auth_url: interruptData.auth_url,
         type: 'authorization'
       }
     }
     ```

## UI Requirements

### 1. Authorization Card

- Centered on screen
- Maximum width of 600px
- Clear visual hierarchy
- Material-UI components

### 2. Alert States

- Warning: Initial authorization request
- Info: Authorization in progress

### 3. Button States

- Start Authorization: Enabled when ready
- Complete Authorization: Enabled after clicking Start

## State Management

### Component State

```typescript
{
  isAuthorizing: boolean;
  interruptData: AuthorizationData | null;
  command: Command | null;
}
```

## Integration Example

```typescript
// Example usage in a React component
const ChatComponent: React.FC = () => {
  const [interruptData, setInterruptData] = useState<AuthorizationData | null>(null);
  const [command, setCommand] = useState<Command | null>(null);

  const handleStream = async () => {
    try {
      const response = await graph.stream(input, config);
      for await (const chunk of response) {
        if (chunk.event === 'interrupt' && chunk.data.type === 'authorization') {
          setInterruptData(chunk.data);
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
    }
  };

  const handleCommand = async (command: Command) => {
    setCommand(command);
    // Send command to LangGraph
    await graph.sendCommand(command);
  };

  return (
    <div>
      {interruptData && (
        <AuthorizationHandler
          interruptData={interruptData}
          onResume={() => {
            setInterruptData(null);
            handleStream();
          }}
          onCommand={handleCommand}
        />
      )}
      {/* Rest of chat UI */}
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

- Component renders with interrupt data
- Start Authorization button opens URL
- UI updates after clicking Start
- Command is sent with correct structure
- Component unmounts cleanly

### Integration Tests

- LangGraph client integration
- Authorization flow start
- State management
- Command handling
- Message state updates

## Accessibility Requirements

### Basic Requirements

- Keyboard navigation support
- ARIA labels for buttons
- Clear focus indicators
- Screen reader announcements

## Security Requirements

### Basic Security

- URL validation
- XSS prevention
- Secure window handling
- Command validation

describe('Command Structure', () => {
it('should handle state updates correctly', () => {
const command: AuthorizationCommand = {
update: {
messages: [{
content: "Authorization required",
type: 'ai'
}]
},
goto: 'wait_for_auth'
};
// Test implementation
});

    it('should handle routing correctly', () => {
        const command: AuthorizationCommand = {
            goto: 'tools',
            update: {
                messages: [{
                    content: "Routing to tools",
                    type: 'ai'
                }]
            }
        };
        // Test implementation
    });

    it('should handle resume correctly', () => {
        const command: AuthorizationCommand = {
            resume: authUrl,
            update: {
                messages: [{
                    content: "Resuming after auth",
                    type: 'ai'
                }]
            }
        };
        // Test implementation
    });

});

const handleAuthorization = (interrupt: AuthorizationInterrupt): AuthorizationCommand => {
return {
update: {
messages: [{
content: "Authorization required",
type: 'ai'
}]
},
goto: 'wait_for_auth'
};
};

const handleResume = (authUrl: string): AuthorizationCommand => {
return {
update: {
messages: [{
content: "Resuming after authorization",
type: 'ai'
}]
},
resume: authUrl
};
};
