import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey?: string) {
  return new Client({
    apiUrl,
    apiKey,
  });
}
