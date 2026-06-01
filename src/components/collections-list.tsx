"use client";

import Link from "next/link";
import type { Collection } from "@/lib/collections";

type CollectionsListProps = {
  collections: Collection[];
  isOwn?: boolean;
  onDelete?: (collectionId: string) => void;
};

export function CollectionsList({ collections, isOwn = false, onDelete }: CollectionsListProps) {
  if (collections.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {isOwn ? "No collections yet. Create one to group your recipes." : "No public collections."}
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/collections/${collection.id}`}
          className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="mt-1 text-xs text-[var(--muted)]">{collection.description}</p>
              )}
            </div>
            {isOwn && onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm(`Delete "${collection.name}"?`)) {
                    onDelete(collection.id);
                  }
                }}
                className="shrink-0 rounded px-2 py-1 text-xs uppercase tracking-[0.12em] text-red-400 transition hover:bg-red-500/20"
              >
                Delete
              </button>
            )}
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            {collection.recipeCount} recipe{collection.recipeCount === 1 ? "" : "s"}
            {collection.isPublic && " · Public"}
          </p>
        </Link>
      ))}
    </div>
  );
}
