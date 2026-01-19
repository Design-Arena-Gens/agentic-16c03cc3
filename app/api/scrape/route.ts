import { NextResponse } from "next/server";
import { fetchSheinCategory } from "@/lib/scraper";
import { detectOutliers, parseSheinPayload } from "@/lib/outliers";
import { createNotionReport } from "@/lib/notion-publisher";
import { sendTelegramUpdate } from "@/lib/telegram";
import { getConfig } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const categoryUrl = String(body.categoryUrl ?? "");
    const category = String(body.category ?? "conjuntos de alfaiataria").toLowerCase();

    if (!categoryUrl) {
      return NextResponse.json({ error: "Missing categoryUrl" }, { status: 400 });
    }

    const scrape = await fetchSheinCategory(categoryUrl);
    const snapshot = parseSheinPayload(scrape.body, category);
    const outliers = await detectOutliers(snapshot);

    const notionResult = outliers.length ? await createNotionReport({ category, products: outliers }) : { skipped: true };

    const telegramMessage = outliers.length
      ? `*Outliers detectados (${category}):*\n${outliers
          .map(
            (product) =>
              `• [${product.title}](${product.productUrl}) · R$ ${product.priceBrl.toFixed(2)} · Reviews: ${product.reviewCount} · Δ ${product.reviewGrowthWeekly.toFixed(1)}%`
          )
          .join("\n")}`
      : `No se detectaron outliers para ${category}`;

    await sendTelegramUpdate({
      text: telegramMessage,
      voiceUrl: body.voiceUrl
    });

    return NextResponse.json({
      snapshot,
      outliers,
      notionResult
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  }
}
