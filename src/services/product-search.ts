
import axios from "axios";

export interface ProductSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

interface SerperResponse {
  organic?: {
    title: string;
    link: string;
    snippet?: string;
  }[];
}

export async function searchProducts(
  query: string
): Promise<ProductSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error("SERPER_API_KEY is missing.");
  }

  const response = await axios.post<SerperResponse>(
    "https://google.serper.dev/search",
    {
      q: query,
      num: 10,
    },
    {
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  const results = response.data.organic ?? [];

  return results.map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet ?? "",
    source: new URL(item.link).hostname,
  }));
}
