import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryParam, StringParam } from "use-query-params";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { RunnableConfig } from "@langchain/core/runnables";

export type StateType = {
  messages: Message[];
  ui?: UIMessage[];
  config?: RunnableConfig;
};

type StreamOptions = {
  apiUrl: string;
  apiKey?: string;
  assistantId: string;
  threadId: string | null;
  userId: string | ""
  onCustomEvent: (event: UIMessage | RemoveUIMessage, options: any) => void;
  onThreadId: (id: string) => void;
  config?: RunnableConfig;
};

const useTypedStream = (options: StreamOptions) => {
  return useStream<StateType, {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      config?: RunnableConfig;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }>(options);
};

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiUrl,
  assistantId,
  userId,
  apiKey,
}: {
  children: ReactNode;
  apiUrl: string;
  assistantId: string;
  userId: string;
  apiKey?: string;
}) => {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const { getThreads, setThreads } = useThreads();
  const config = {
    configurable: {
      user_id: userId ?? "",
      thread_id: threadId ?? undefined,
    }
  } as RunnableConfig;

  const streamValue = useTypedStream({
    apiUrl: apiUrl,
    assistantId,
    threadId: threadId ?? null,
    userId,
    apiKey: apiKey ?? undefined,
    config: {
      configurable: {
        user_id: userId ?? "",
        thread_id: threadId ?? undefined,
      }
    },
    onCustomEvent: (event, options) => {
      options.mutate((prev: StateType) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui, config };
      });
    },
    onThreadId: (id) => {
      setThreadId(id);
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey ?? null).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code>.
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiUrl, apiKey]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [apiUrl, setApiUrl] = useQueryParam("apiUrl", StringParam);
  const [userId, setUserId] = useState(() => {
    return window.localStorage.getItem("lg:chat:userId") ?? "";
  });

  const setUserIdValue = (id: string) => {
    window.localStorage.setItem("lg:chat:userId", id);
    setUserId(id);
  };

  const [assistantId, setAssistantId] = useQueryParam(
    "assistantId",
    StringParam,
  );

  if (!apiUrl || !assistantId || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full p-4">
        <div className="animate-in fade-in-0 zoom-in-95 flex flex-col border bg-background shadow-lg rounded-lg max-w-3xl">
          <div className="flex flex-col gap-2 mt-14 p-6 border-b">
            <div className="flex items-start flex-col gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Agent Chat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Agent Chat! Before you get started, you need to enter
              the URL of the deployment, the assistant / graph ID, and your user ID.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const apiUrl = formData.get("apiUrl") as string;
              const assistantId = formData.get("assistantId") as string;
              const userId = formData.get("userId") as string;

              setApiUrl(apiUrl);
              setAssistantId(assistantId);
              setUserIdValue(userId);

              form.reset();
            }}
            className="flex flex-col gap-6 p-6 bg-muted/50"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiUrl">
                Deployment URL<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is the URL of your LangGraph deployment. Can be a local, or
                production deployment.
              </p>
              <Input
                id="apiUrl"
                name="apiUrl"
                className="bg-background"
                defaultValue={apiUrl ?? import.meta.env.VITE_LANGGRAPH_API_URL ?? "http://localhost:2024"}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="assistantId">
                Assistant / Graph ID<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is the ID of the graph (can be the graph name), or
                assistant to fetch threads from, and invoke when actions are
                taken.
              </p>
              <Input
                id="assistantId"
                name="assistantId"
                className="bg-background"
                defaultValue={assistantId ?? import.meta.env.VITE_LANGGRAPH_ASSISTANT_ID ?? "graph"}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="userId">
                User ID<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is your unique identifier. It will be included in all requests to the LangGraph server.
              </p>
              <Input
                id="userId"
                name="userId"
                className="bg-background"
                defaultValue={userId ?? ""}
                required
              />
            </div>

            <div className="flex justify-end mt-2">
              <Button type="submit" size="lg">
                Continue
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <StreamSession
      apiUrl={apiUrl}
      assistantId={assistantId}
      userId={userId}
      apiKey={process.env.LANGSMITH_API_KEY ?? null}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
