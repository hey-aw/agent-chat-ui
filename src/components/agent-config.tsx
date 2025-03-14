import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type AgentConfig = {
    systemPrompt: string;
    model: string;
    maxSearchResults: number;
    userId?: string;
    debugMode: boolean;
    logLevel: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
};

interface AgentConfigProps {
    config: AgentConfig;
    onChange: (config: AgentConfig) => void;
}

export function AgentConfig({ config, onChange }: AgentConfigProps) {
    const handleChange = (
        field: keyof AgentConfig,
        value: string | number | boolean
    ) => {
        onChange({
            ...config,
            [field]: value,
        });
    };

    return (
        <div className="w-full space-y-6">
            <div className="space-y-3">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                    id="systemPrompt"
                    value={config.systemPrompt}
                    onChange={(e) => handleChange("systemPrompt", e.target.value)}
                    placeholder="Enter system prompt..."
                    className="min-h-[100px]"
                />
                <p className="text-sm text-muted-foreground">
                    Sets the context and behavior for the agent
                </p>
            </div>

            <div className="space-y-3">
                <Label htmlFor="model">Model</Label>
                <Input
                    id="model"
                    value={config.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    placeholder="provider/model-name"
                />
                <p className="text-sm text-muted-foreground">
                    Language model for agent interactions (e.g. openai/gpt-4)
                </p>
            </div>

            <div className="space-y-3">
                <Label htmlFor="maxSearchResults">Max Search Results</Label>
                <Input
                    id="maxSearchResults"
                    type="number"
                    value={config.maxSearchResults}
                    onChange={(e) => handleChange("maxSearchResults", Number(e.target.value))}
                    min={1}
                />
            </div>

            <div className="space-y-3">
                <Label htmlFor="userId">User ID</Label>
                <p className="text-sm text-muted-foreground">
                    {config.userId}
                </p>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="debugMode"
                    checked={config.debugMode}
                    onCheckedChange={(checked) => handleChange("debugMode", checked)}
                />
                <Label htmlFor="debugMode">Debug Mode</Label>
            </div>

            <div className="space-y-3">
                <Label htmlFor="logLevel">Log Level</Label>
                <Select
                    value={config.logLevel}
                    onValueChange={(value: AgentConfig["logLevel"]) =>
                        handleChange("logLevel", value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select log level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DEBUG">DEBUG</SelectItem>
                        <SelectItem value="INFO">INFO</SelectItem>
                        <SelectItem value="WARNING">WARNING</SelectItem>
                        <SelectItem value="ERROR">ERROR</SelectItem>
                        <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
} 