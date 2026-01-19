import type { OutlierProduct } from "@/types/outlier";
import { getConfig } from "./config";
import { getNotionClient } from "./notion";

type CreatePageInput = {
  category: string;
  products: OutlierProduct[];
};

export const createNotionReport = async ({ category, products }: CreatePageInput) => {
  const notion = getNotionClient();
  const { NOTION_DATABASE_ID } = getConfig();

  if (!notion || !NOTION_DATABASE_ID) {
    return { skipped: true };
  }

  const coverImage = products[0]?.imageUrl;
  const created = await notion.pages.create({
    parent: { database_id: NOTION_DATABASE_ID },
    cover: coverImage
      ? {
          type: "external",
          external: { url: coverImage }
        }
      : undefined,
    properties: {
      Name: {
        title: [
          {
            text: {
              content: `Outliers Shein · ${category}`
            }
          }
        ]
      },
      Category: {
        select: {
          name: category
        }
      },
      "# Productos": {
        number: products.length
      }
    },
    children: products.flatMap((product) => [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [
            {
              type: "text",
              text: {
                content: product.title
              }
            }
          ]
        }
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                content: `Precio: R$ ${product.priceBrl.toFixed(2)} · Reviews: ${product.reviewCount} · Crecimiento semanal: ${product.reviewGrowthWeekly.toFixed(2)}%`
              }
            }
          ]
        }
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              type: "text",
              text: {
                content: `Justificación: ${product.justification}`
              }
            }
          ]
        }
      },
      {
        object: "block",
        type: "image",
        image: {
          type: "external",
          external: {
            url: product.imageUrl
          }
        }
      },
      {
        object: "block",
        type: "bookmark",
        bookmark: {
          url: product.productUrl
        }
      }
    ])
  });

  return {
    skipped: false,
    pageId: created.id,
    url: "url" in created ? created.url ?? null : null
  };
};
