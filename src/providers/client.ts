import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined) {
  return new Client({
    apiKey: apiKey ?? process.env.LANGSMITH_API_KEY ?? "",
    apiUrl,
  });
}
