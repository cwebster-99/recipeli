"use client";

import { useState, useEffect, useCallback } from "react";
import type { Collection } from "@/lib/collections";

type CollectionSelectorProps = {
  recipeId: string;
  onCollectionsUpdate?: () => void;
};

export function CollectionSelector({ recipeId, onCollectionsUpdate }: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch("/api/collections");
      if (!response.ok) throw new Error("Failed to fetch collections");

      const data = (await response.json()) as { collections: Collection[] };
      setCollections(data.collections);

      const selected = new Set<string>();
      for (const collection of data.collections) {
        const collectionDetail = await fetch(`/api/collections/${collection.id}`);
        if (collectionDetail.ok) {
          const detail = (await collectionDetail.json()) as { recipes: Array<{ id: string }> };
          if (detail.recipes.some((r) => r.id === recipeId)) {
            selected.add(collection.id);
          }
        }
      }
      setSelectedCollectionIds(selected);
    } catch {
      setError("Failed to load collections");
    }
  }, [recipeId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newCollectionName }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to create collection");
      }

      setNewCollectionName("");
      await fetchCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleCollection(collectionId: string, isAdding: boolean) {
    const url = isAdding
      ? `/api/collections/${collectionId}/recipes/${recipeId}`
      : `/api/collections/${collectionId}/recipes/${recipeId}`;

    const method = isAdding ? "POST" : "DELETE";

    try {
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: isAdding ? JSON.stringify({ recipeId }) : undefined,
      });

      if (!response.ok) throw new Error("Failed to update collection");

      const newSelected = new Set(selectedCollectionIds);
      if (isAdding) {
        newSelected.add(collectionId);
      } else {
        newSelected.delete(collectionId);
      }
      setSelectedCollectionIds(newSelected);
      onCollectionsUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update collection");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-[1.75rem] border border-white/15 bg-black/40 px-4 py-3 text-left text-sm transition hover:border-white/25"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Add to collection</p>
        {selectedCollectionIds.size > 0 && (
          <p className="mt-2 text-sm text-[var(--foreground)]">
            {selectedCollectionIds.size} collection{selectedCollectionIds.size === 1 ? "" : "s"}
          </p>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/15 bg-black/80 p-4 backdrop-blur-md">
          {error && (
            <p className="mb-3 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-200">{error}</p>
          )}

          <div className="mb-4 space-y-2">
            {collections.map((collection) => (
              <label key={collection.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={selectedCollectionIds.has(collection.id)}
                  onChange={(e) =>
                    handleToggleCollection(collection.id, e.target.checked)
                  }
                  className="h-4 w-4 rounded border-white/25 bg-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {collection.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {collection.recipeCount} recipe{collection.recipeCount === 1 ? "" : "s"}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">New collection</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                }}
                placeholder="Weeknight, Date Night..."
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
              />
              <button
                onClick={handleCreateCollection}
                disabled={isCreating || !newCollectionName.trim()}
                className="rounded-lg border border-white/15 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Add"}
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-3 w-full rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
