import { formatISO, subDays } from "date-fns";
import { supabaseClient } from "./supabase";
import type { OutlierProduct } from "@/types/outlier";

export type RawSheinProduct = {
  goods_id: string;
  goods_name: string;
  salePrice: number;
  salePriceCurrency: string;
  goods_img: string;
  detail_url: string;
  review_num: number;
  tag_list?: { tag?: string }[];
};

export type ParsedSnapshot = {
  snapshotId: string;
  collectedAt: string;
  category: string;
  products: RawSheinProduct[];
};

const CATEGORY_ALLOWLIST = new Set([
  "conjuntos de alfaiataria",
  "vestidos de verão"
]);

export const parseSheinPayload = (html: string, category: string): ParsedSnapshot => {
  const nuxtMatch = html.match(/window\.__NUXT__=([^;]+);/);
  if (!nuxtMatch) {
    throw new Error("Unable to locate Shein payload");
  }

  let nuxtData: any;
  try {
    nuxtData = JSON.parse(nuxtMatch[1]);
  } catch (error) {
    throw new Error(`Failed to parse Shein payload: ${(error as Error).message}`);
  }

  const productList =
    nuxtData?.state?.category?.data?.products?.goodsList ||
    nuxtData?.data?.[0]?.goodsList ||
    [];

  if (!Array.isArray(productList) || productList.length === 0) {
    throw new Error("No products detected in Shein payload");
  }

  const normalizedCategory = category.toLowerCase();
  const now = new Date();

  const parsed: ParsedSnapshot = {
    snapshotId: `${normalizedCategory}-${now.getTime()}`,
    collectedAt: formatISO(now),
    category: normalizedCategory,
    products: productList
      .map((item: any) => ({
        goods_id: String(item.goods_id ?? item.goodsId ?? item.id),
        goods_name: item.goods_name ?? item.goodsName ?? item.title,
        salePrice: Number(item.salePrice ?? item.retail_price ?? item.price?.amount ?? 0),
        salePriceCurrency: item.salePriceCurrency ?? item.price?.currency ?? "BRL",
        goods_img: item.goods_img ?? item.goodsImg ?? item.image,
        detail_url: item.detail_url ?? item.detailUrl ?? item.shareUrl ?? item.url,
        review_num: Number(item.review_num ?? item.reviewNum ?? item.review?.count ?? 0),
        tag_list: item.tag_list ?? item.tags ?? []
      }))
      .filter((item: RawSheinProduct) => Boolean(item.goods_id && item.goods_name && item.detail_url))
  };

  return parsed;
};

export const detectOutliers = async (
  snapshot: ParsedSnapshot
): Promise<OutlierProduct[]> => {
  if (!CATEGORY_ALLOWLIST.has(snapshot.category)) {
    return [];
  }

  const client = supabaseClient();
  const { data: previousRecords } = await client
    .from("shein_raw_snapshots")
    .select("goods_id, review_num, collected_at")
    .eq("category", snapshot.category)
    .gte("collected_at", formatISO(subDays(new Date(snapshot.collectedAt), 14)));

  const growthMap = new Map<string, { prev: number; growth: number }>();
  previousRecords?.forEach((record) => {
    const prev = Number(record.review_num ?? 0);
    const next = growthMap.get(record.goods_id)?.prev ?? prev;
    growthMap.set(record.goods_id, { prev: Math.max(prev, next), growth: 0 });
  });

  const outliers: OutlierProduct[] = [];
  for (const product of snapshot.products) {
    const baseline = growthMap.get(product.goods_id)?.prev ?? 0;
    const baselineSafe = baseline === 0 ? Math.max(product.review_num * 0.25, 1) : baseline;
    const growth = ((product.review_num - baselineSafe) / baselineSafe) * 100;
    const hasHotSaleTag = (product.tag_list || []).some((tag) =>
      String(tag.tag ?? "").toLowerCase().includes("hot")
    );
    const isGrowthOutlier = growth >= 20;
    const isScarceHotSale = hasHotSaleTag && product.review_num < 100;

    if (!(isGrowthOutlier || isScarceHotSale)) {
      continue;
    }

    const priceBrl = product.salePriceCurrency === "BRL"
      ? product.salePrice
      : product.salePrice * 5.2;

    outliers.push({
      id: product.goods_id,
      title: product.goods_name,
      imageUrl: product.goods_img,
      productUrl: product.detail_url,
      priceBrl,
      reviewCount: product.review_num,
      reviewGrowthWeekly: Number(growth.toFixed(2)),
      tags: (product.tag_list || []).map((tag) => String(tag.tag ?? "").trim()).filter(Boolean),
      justification: isScarceHotSale
        ? "Etiqueta Hot Sale con tracción inicial y baja saturación (<100 reseñas)."
        : "Crecimiento de reseñas >20% en la última semana según histórico Supabase.",
      collectedAt: snapshot.collectedAt,
      category: snapshot.category
    });
  }

  if (snapshot.products.length) {
    await client.from("shein_raw_snapshots").insert(
      snapshot.products.map((product) => ({
        snapshot_id: snapshot.snapshotId,
        goods_id: product.goods_id,
        payload: product,
        category: snapshot.category,
        review_num: product.review_num,
        collected_at: snapshot.collectedAt
      }))
    );
  }

  if (outliers.length) {
    await client.from("shein_outliers").insert(
      outliers.map((product) => ({
        product_id: product.id,
        snapshot_id: snapshot.snapshotId,
        payload: product,
        price_brl: product.priceBrl,
        review_growth_weekly: product.reviewGrowthWeekly,
        collected_at: snapshot.collectedAt,
        category: snapshot.category
      }))
    );
  }

  return outliers;
};
