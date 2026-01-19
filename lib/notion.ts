import { Client } from "@notionhq/client";
import { getConfig } from "./config";

let notionClient: Client | null = null;

export const getNotionClient = (): Client | null => {
  const { NOTION_TOKEN } = getConfig();
  if (!NOTION_TOKEN) {
    return null;
  }

  if (!notionClient) {
    notionClient = new Client({ auth: NOTION_TOKEN });
  }

  return notionClient;
};
