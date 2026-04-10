export type ImportedRecipeDraft = {
  title: string;
  summary: string;
  cuisine: string;
  cookTime: number;
  ingredients: string[];
  instructions: string[];
  author: string;
  sourceUrl: string;
};

export type RecipeImportResult = {
  imported: ImportedRecipeDraft;
  warnings: string[];
};

type JsonObject = Record<string, unknown>;

const MAX_FIELD_LENGTH = 240;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "));
}

function normalizeText(value: string, maxLength = MAX_FIELD_LENGTH) {
  return stripTags(value)
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeList(values: string[]) {
  return values
    .map((value) => value.replace(/^[\s\-\u2022\d.)]+/, "").trim())
    .map((value) => normalizeText(value, 400))
    .filter((value) => value.length > 1)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 40);
}

function parseDurationToMinutes(value: string | undefined) {
  if (!value) {
    return null;
  }

  const isoMatch = value.match(/P(?:\d+D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/i);
  if (isoMatch) {
    const hours = Number(isoMatch[1] ?? "0");
    const minutes = Number(isoMatch[2] ?? "0");
    const total = hours * 60 + minutes;
    if (total > 0) {
      return total;
    }
  }

  const hoursMatch = value.match(/(\d+)\s*h(?:our|r)?/i);
  const minutesMatch = value.match(/(\d+)\s*m(?:in|inute)?/i);
  if (hoursMatch || minutesMatch) {
    return Number(hoursMatch?.[1] ?? 0) * 60 + Number(minutesMatch?.[1] ?? 0);
  }

  const numberOnly = value.match(/\b(\d{1,3})\b/);
  if (numberOnly) {
    return Number(numberOnly[1]);
  }

  return null;
}

function readMetaTag(html: string, keys: string[]) {
  for (const key of keys) {
    const keyPattern = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)=(["'])${keyPattern}\\1[^>]+content=(["'])(.*?)\\2[^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=(["'])(.*?)\\1[^>]+(?:name|property)=(["'])${keyPattern}\\3[^>]*>`, "i")
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const contentValue = match[3] ?? match[2] ?? "";
        if (contentValue) {
          return normalizeText(contentValue, 800);
        }
      }
    }
  }

  return "";
}

function extractTitle(html: string) {
  const ogTitle = readMetaTag(html, ["og:title", "twitter:title"]);
  if (ogTitle) {
    return ogTitle;
  }

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return titleMatch ? normalizeText(titleMatch[1], 120) : "";
}

function parseJsonText(value: string): unknown[] {
  const normalized = value.trim();
  if (!normalized) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function extractJsonLdBlocks(html: string) {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  const blocks: unknown[] = [];

  for (const script of scripts) {
    const contentMatch = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!contentMatch?.[1]) {
      continue;
    }

    const entries = parseJsonText(contentMatch[1]);
    blocks.push(...entries);
  }

  return blocks;
}

function flattenNodes(value: unknown): JsonObject[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenNodes(item));
  }

  const objectValue = value as JsonObject;
  const graph = objectValue["@graph"];

  if (Array.isArray(graph)) {
    return [objectValue, ...flattenNodes(graph)];
  }

  return [objectValue];
}

function isRecipeNode(node: JsonObject) {
  const nodeType = node["@type"];
  const types = Array.isArray(nodeType) ? nodeType : [nodeType];
  return types.some((type) => typeof type === "string" && type.toLowerCase() === "recipe");
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readAuthor(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const name = (value as JsonObject).name;
  return typeof name === "string" ? name : "";
}

function readInstructionLines(value: unknown): string[] {
  if (typeof value === "string") {
    return value.split(/\n|\r/).map((line) => line.trim()).filter(Boolean);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (!item || typeof item !== "object") {
        return "";
      }

      const itemObject = item as JsonObject;
      if (typeof itemObject.text === "string") {
        return itemObject.text;
      }

      if (Array.isArray(itemObject.itemListElement)) {
        return readInstructionLines(itemObject.itemListElement).join("\n");
      }

      return "";
    })
    .flatMap((entry) => entry.split(/\n|\r/))
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractListNearHeading(html: string, headingWord: string) {
  const headingMatch = new RegExp(`<h[1-6][^>]*>[^<]*${headingWord}[^<]*<\/h[1-6]>`, "i").exec(html);
  if (!headingMatch || headingMatch.index < 0) {
    return [];
  }

  const snippet = html.slice(headingMatch.index, headingMatch.index + 7000);
  const listMatches = snippet.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? [];

  return listMatches.map((item) => {
    const match = item.match(/<li[^>]*>([\s\S]*?)<\/li>/i);
    return normalizeText(match?.[1] ?? "", 400);
  });
}

function extractByClassHint(html: string, hint: string) {
  const pattern = new RegExp(`<li[^>]*(?:class|id)=(["'])[^"']*${hint}[^"']*\\1[^>]*>([\\s\\S]*?)<\\/li>`, "gi");
  const matches: string[] = [];

  for (const match of html.matchAll(pattern)) {
    matches.push(normalizeText(match[2] ?? "", 400));
  }

  return matches;
}

function createDraftFromJsonLd(nodes: JsonObject[], sourceUrl: string) {
  const recipeNode = nodes.find(isRecipeNode);
  if (!recipeNode) {
    return null;
  }

  const cookTime = parseDurationToMinutes(readString(recipeNode.totalTime))
    ?? parseDurationToMinutes(readString(recipeNode.cookTime))
    ?? parseDurationToMinutes(readString(recipeNode.prepTime))
    ?? 30;

  return {
    title: normalizeText(readString(recipeNode.name), 120),
    summary: normalizeText(readString(recipeNode.description), 400),
    cuisine: normalizeText(readString(recipeNode.recipeCuisine), 80),
    cookTime,
    ingredients: normalizeList(
      Array.isArray(recipeNode.recipeIngredient)
        ? recipeNode.recipeIngredient.map((entry) => readString(entry))
        : []
    ),
    instructions: normalizeList(readInstructionLines(recipeNode.recipeInstructions)),
    author: normalizeText(readAuthor(recipeNode.author), 80),
    sourceUrl
  } satisfies ImportedRecipeDraft;
}

export function importRecipeFromHtml(html: string, sourceUrl: string): RecipeImportResult {
  const warnings: string[] = [];
  const trimmedHtml = html.trim();

  if (!trimmedHtml) {
    throw new Error("Empty page content.");
  }

  const jsonLdNodes = extractJsonLdBlocks(trimmedHtml).flatMap((entry) => flattenNodes(entry));
  const fromJsonLd = createDraftFromJsonLd(jsonLdNodes, sourceUrl);

  const title = fromJsonLd?.title || extractTitle(trimmedHtml);
  const summary = fromJsonLd?.summary || readMetaTag(trimmedHtml, ["description", "og:description", "twitter:description"]);
  const cuisine = fromJsonLd?.cuisine || readMetaTag(trimmedHtml, ["recipe:cuisine", "og:site_name"]);

  const fallbackIngredients = normalizeList([
    ...extractByClassHint(trimmedHtml, "ingredient"),
    ...extractListNearHeading(trimmedHtml, "ingredients")
  ]);

  const fallbackInstructions = normalizeList([
    ...extractByClassHint(trimmedHtml, "instruction"),
    ...extractByClassHint(trimmedHtml, "direction"),
    ...extractListNearHeading(trimmedHtml, "instructions"),
    ...extractListNearHeading(trimmedHtml, "method")
  ]);

  const cookTime = fromJsonLd?.cookTime
    ?? parseDurationToMinutes(readMetaTag(trimmedHtml, ["cook_time", "recipe:total_time"]))
    ?? 30;

  const imported: ImportedRecipeDraft = {
    title: title || "",
    summary: summary || "",
    cuisine: cuisine || "Imported",
    cookTime,
    ingredients: fromJsonLd?.ingredients.length ? fromJsonLd.ingredients : fallbackIngredients,
    instructions: fromJsonLd?.instructions.length ? fromJsonLd.instructions : fallbackInstructions,
    author: fromJsonLd?.author || "",
    sourceUrl
  };

  if (!fromJsonLd) {
    warnings.push("No structured recipe schema found; used best-effort parsing.");
  }

  if (!imported.title) {
    warnings.push("Could not reliably detect recipe title.");
  }

  if (imported.ingredients.length === 0) {
    warnings.push("Could not reliably detect ingredients list.");
  }

  if (imported.instructions.length === 0) {
    warnings.push("Could not reliably detect instructions.");
  }

  if (!imported.summary) {
    warnings.push("Description is missing; add a summary before saving.");
  }

  if (!imported.title && imported.ingredients.length === 0 && imported.instructions.length === 0) {
    throw new Error("Could not extract recipe details from this page.");
  }

  return { imported, warnings };
}
