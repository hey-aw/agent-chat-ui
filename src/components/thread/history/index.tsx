import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";

import { getContentString } from "../utils";
import { useQueryParam, StringParam, BooleanParam } from "use-query-params";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose, Settings } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AgentConfig } from "@/components/agent-config";
import { Separator } from "@/components/ui/separator";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import { StateType } from "@/providers/Stream";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);

  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        return (
          <div key={t.thread_id} className="w-full px-1">
            <Button
              variant="ghost"
              className="text-left items-start justify-start font-normal w-[280px]"
              onClick={(e) => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (t.thread_id === threadId) return;
                setThreadId(t.thread_id);
              }}
            >
              <p className="truncate text-ellipsis">{itemText}</p>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="w-[280px] h-10" />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryParam(
    "chatHistoryOpen",
    BooleanParam,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const stream = useStreamContext();
  const streamState = stream.values;

  // Ensure chatHistoryOpen is always a boolean
  const isHistoryOpen = chatHistoryOpen ?? false;

  const getDefaultConfig = (): AgentConfig => {
    const currentConfig = streamState?.config as Record<string, any> | undefined;
    return {
      systemPrompt: currentConfig?.["system_prompt"] ?? "You are a helpful AI assistant.",
      model: currentConfig?.["model"] ?? "openai/gpt-4",
      maxSearchResults: currentConfig?.["max_search_results"] ?? 10,
      userId: currentConfig?.["user_id"] ?? "agent-chat-ui-vercel-key",
      debugMode: currentConfig?.["debug_mode"] ?? false,
      logLevel: (currentConfig?.["log_level"] as AgentConfig["logLevel"]) ?? "INFO"
    };
  };

  const [config, setConfig] = useState<AgentConfig>(() => {
    // Try to load from localStorage first
    const savedConfig = localStorage.getItem("agent_config");
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error("Failed to parse saved config:", e);
      }
    }

    return getDefaultConfig();
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'r' && settingsOpen) {
        e.preventDefault();
        const defaultConfig = getDefaultConfig();
        handleConfigChange(defaultConfig);
        toast.info("Settings reset to defaults", {
          id: "settings-update"
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, streamState]);

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  // Save config to localStorage and update stream state when it changes
  const handleConfigChange = (newConfig: AgentConfig) => {
    setConfig(newConfig);
    localStorage.setItem("agent_config", JSON.stringify(newConfig));

    // Update the stream config
    const updatedConfig: Record<string, any> = {
      "system_prompt": newConfig.systemPrompt,
      "model": newConfig.model,
      "max_search_results": newConfig.maxSearchResults,
      "user_id": newConfig.userId,
      "debug_mode": newConfig.debugMode,
      "log_level": newConfig.logLevel
    };

    stream.submit(
      { config: updatedConfig },
      { streamMode: ["values"] }
    );

    // Wait a bit before showing the success toast
    setTimeout(() => {
      toast.success("Settings saved successfully", {
        id: "settings-update"
      });
    }, 500);
  };

  const SettingsButton = () => (
    <Button
      variant="ghost"
      className="w-full flex items-center gap-2 justify-start px-4 py-2 hover:bg-gray-100"
      onClick={() => setSettingsOpen(true)}
    >
      <Settings className="h-5 w-5" />
      <span>Settings</span>
    </Button>
  );

  return (
    <>
      <Collapsible
        open={isHistoryOpen}
        onOpenChange={setChatHistoryOpen}
        className="hidden lg:block"
      >
        <CollapsibleContent className="data-[state=open]:animate-slide-right data-[state=closed]:animate-slide-left">
          <div className="flex flex-col border-r-[1px] border-slate-300 items-start justify-start h-screen w-[300px] shrink-0 shadow-inner-right relative">
            <div className="flex items-center justify-between w-full pt-1.5 px-4">
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button
                    className="hover:bg-gray-100"
                    variant="ghost"
                  >
                    {isHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <h1 className="text-xl font-semibold tracking-tight">
                  Thread History
                </h1>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {threadsLoading ? (
                <ThreadHistoryLoading />
              ) : (
                <ThreadList threads={threads} />
              )}
            </div>

            <div className="flex-none w-full">
              <Separator className="my-2" />
              <SettingsButton />
            </div>

            {/* Settings Panel */}
            <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader>
                    <DrawerTitle>Agent Settings</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4">
                    <AgentConfig config={config} onChange={handleConfigChange} />
                  </div>
                  <DrawerFooter className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const defaultConfig = getDefaultConfig();
                        handleConfigChange(defaultConfig);
                        toast.info("Settings reset to defaults", {
                          id: "settings-update"
                        });
                      }}
                    >
                      Reset to Defaults
                    </Button>
                    <DrawerClose asChild>
                      <Button variant="outline" size="sm">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent side="left" className="lg:hidden flex flex-col">
            <SheetHeader className="flex-none">
              <SheetTitle>Thread History</SheetTitle>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="flex-1 overflow-hidden">
              <ThreadList
                threads={threads}
                onThreadClick={() => setChatHistoryOpen((o) => !o)}
              />
            </div>
            <div className="flex-none w-full">
              <Separator className="my-2" />
              <SettingsButton />
            </div>

            {/* Settings Panel for Mobile */}
            <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader>
                    <DrawerTitle>Agent Settings</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4">
                    <AgentConfig config={config} onChange={handleConfigChange} />
                  </div>
                  <DrawerFooter className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const defaultConfig = getDefaultConfig();
                        handleConfigChange(defaultConfig);
                        toast.info("Settings reset to defaults", {
                          id: "settings-update"
                        });
                      }}
                    >
                      Reset to Defaults
                    </Button>
                    <DrawerClose asChild>
                      <Button variant="outline" size="sm">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
