"use client";

import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

type SubmitFormState = {
  title: string;
  summary: string;
  cuisine: string;
  cookTime: string;
  note: string;
  sourceUrl: string;
  ingredientsText: string;
  instructionsText: string;
  imageUrl: string;
};

type ImportedPayload = {
  imported: {
    title: string;
    summary: string;
    cuisine: string;
    cookTime: number;
    ingredients: string[];
    instructions: string[];
    sourceUrl: string;
  };
  warnings: string[];
};

const initialFormState: SubmitFormState = {
  title: "",
  summary: "",
  cuisine: "",
  cookTime: "",
  note: "",
  sourceUrl: "",
  ingredientsText: "",
  instructionsText: "",
  imageUrl: ""
};

function toMultiline(values: string[]) {
  return values.join("\n");
}

function parseMultiline(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatRequestError(error: unknown, action: "import" | "save") {
  if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
    return action === "import"
      ? "Cannot reach Recipeli import API. Confirm the app server is running and reload this page."
      : "Cannot reach Recipeli save API. Confirm the app server is running and reload this page.";
  }

  return error instanceof Error
    ? error.message
    : action === "import"
      ? "Recipe import failed."
      : "Unable to save recipe.";
}

export default function SubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState<SubmitFormState>(initialFormState);
  const [linkInput, setLinkInput] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importError, setImportError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingredientCount = useMemo(() => parseMultiline(form.ingredientsText).length, [form.ingredientsText]);
  const instructionCount = useMemo(() => parseMultiline(form.instructionsText).length, [form.instructionsText]);

  const setField = (key: keyof SubmitFormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Image must be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setField("imageUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImport = async () => {
    const url = linkInput.trim();
    if (!url) {
      setImportError("Paste a recipe URL first.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportWarnings([]);

    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (response.status === 401) {
        router.push("/login?callbackUrl=/submit" as Route);
        return;
      }

      const payload = (await response.json()) as ImportedPayload | { error: string };

      if (!response.ok || !("imported" in payload)) {
        throw new Error("error" in payload ? payload.error : "Recipe import failed.");
      }

      const { imported, warnings } = payload;
      setForm((previous) => ({
        ...previous,
        title: imported.title || previous.title,
        summary: imported.summary || previous.summary,
        cuisine: imported.cuisine || previous.cuisine,
        cookTime: imported.cookTime ? String(imported.cookTime) : previous.cookTime,
        sourceUrl: imported.sourceUrl || previous.sourceUrl,
        ingredientsText: imported.ingredients.length > 0 ? toMultiline(imported.ingredients) : previous.ingredientsText,
        instructionsText: imported.instructions.length > 0 ? toMultiline(imported.instructions) : previous.instructionsText
      }));

      setImportWarnings(warnings);
      setLinkInput(imported.sourceUrl || url);
    } catch (error) {
      setImportError(formatRequestError(error, "import"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.title.trim()) {
      setSubmitError("Title is required before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          cuisine: form.cuisine,
          cookTime: Number.parseInt(form.cookTime, 10) || 30,
          note: form.note,
          sourceUrl: form.sourceUrl,
          ingredients: parseMultiline(form.ingredientsText),
          instructions: parseMultiline(form.instructionsText),
          imageUrl: form.imageUrl || undefined
        })
      });

      if (response.status === 401) {
        router.push("/login?callbackUrl=/submit" as Route);
        return;
      }

      const payload = (await response.json()) as { recipe?: { slug: string }; error?: string };

      if (!response.ok || !payload.recipe) {
        throw new Error(payload.error || "Unable to save recipe.");
      }

      router.push(`/recipes/${payload.recipe.slug}`);
      router.refresh();
    } catch (error) {
      setSubmitError(formatRequestError(error, "save"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Submission flow</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.94] text-[var(--foreground)] sm:text-6xl">
          Add a recipe from a link.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Paste a URL to auto-fill title, cook time, ingredients, and steps. Every field stays editable before you save.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Recipe link
            <input
              type="url"
              value={linkInput}
              onChange={(event) => setLinkInput(event.target.value)}
              placeholder="https://example.com/recipe"
              className="rounded-[1.2rem] border border-white/10 bg-black/15 px-4 py-3 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            />
          </label>

          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting}
            className="mt-4 inline-flex items-center rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--background)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isImporting ? "Importing..." : "Import from link"}
          </button>

          {importError ? <p className="mt-3 text-sm text-red-300">{importError}</p> : null}
          {importWarnings.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-amber-200">
              {importWarnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Recipe title
            <input
              type="text"
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Brown butter tomato toast"
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Recipe source URL
            <input
              type="url"
              value={form.sourceUrl}
              onChange={(event) => setField("sourceUrl", event.target.value)}
              placeholder="https://example.com/recipe"
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
              Cuisine
              <input
                type="text"
                value={form.cuisine}
                onChange={(event) => setField("cuisine", event.target.value)}
                placeholder="Seasonal American"
                className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              />
            </label>

            <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
              Cook time (minutes)
              <input
                type="number"
                min={1}
                value={form.cookTime}
                onChange={(event) => setField("cookTime", event.target.value)}
                placeholder="20"
                className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Summary
            <textarea
              rows={4}
              value={form.summary}
              onChange={(event) => setField("summary", event.target.value)}
              placeholder="What makes this recipe memorable enough to save and rank?"
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            />
          </label>

          <fieldset className="grid gap-3">
            <legend className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Recipe photo</legend>

            {form.imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Recipe preview"
                  className="h-48 w-full rounded-[1.5rem] border border-white/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setField("imageUrl", "");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white transition hover:bg-black/80"
                >
                  Remove
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center rounded-full border border-white/10 bg-black/15 px-5 py-3 text-sm normal-case tracking-normal text-[var(--foreground)] transition hover:border-[var(--accent)]"
              >
                Choose file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
              <input
                type="url"
                value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                onChange={(event) => setField("imageUrl", event.target.value)}
                placeholder="Or paste an image URL"
                className="flex-1 rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-3 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              />
            </div>
          </fieldset>

          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Ingredient list ({ingredientCount})
            <textarea
              rows={6}
              value={form.ingredientsText}
              onChange={(event) => setField("ingredientsText", event.target.value)}
              placeholder={"6 slices sourdough\n4 tomatoes\n2 tbsp brown butter\nflaky salt"}
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Method steps ({instructionCount})
            <textarea
              rows={7}
              value={form.instructionsText}
              onChange={(event) => setField("instructionsText", event.target.value)}
              placeholder={"Toast breadcrumbs in butter.\nCook pasta and reserve water.\nBuild sauce with gochujang and cream.\nToss and finish."}
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Personal note
            <textarea
              rows={4}
              value={form.note}
              onChange={(event) => setField("note", event.target.value)}
              placeholder="Why this belongs in your app."
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            />
          </label>

          {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-fit items-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--background)] transition hover:bg-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? "Saving recipe..." : "Add recipe"}
          </button>
        </form>
      </section>
    </main>
  );
}
