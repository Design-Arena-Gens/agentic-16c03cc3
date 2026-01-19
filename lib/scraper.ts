import { getConfig } from "./config";

export type ScrapeResult = {
  status: number;
  body: string;
};

const SCRAPING_ENDPOINTS = {
  scrapingbee: "https://app.scrapingbee.com/api/v1",
  zenrows: "https://api.zenrows.com/v1"
} as const;

export const fetchSheinCategory = async (categoryUrl: string): Promise<ScrapeResult> => {
  const { SCRAPING_PROVIDER, SCRAPING_API_KEY } = getConfig();
  const endpoint = SCRAPING_ENDPOINTS[SCRAPING_PROVIDER];

  const params = new URLSearchParams({
    url: categoryUrl
  });

  if (SCRAPING_PROVIDER === "scrapingbee") {
    params.append("api_key", SCRAPING_API_KEY);
    params.append("render_js", "true");
    params.append("premium_proxy", "true");
    params.append("stealth_proxy", "true");
  } else {
    params.append("apikey", SCRAPING_API_KEY);
    params.append("js_render", "true");
    params.append("premium_proxy", "true");
    params.append("proxy_country", "br");
  }

  const url = `${endpoint}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  return { status: response.status, body };
};
