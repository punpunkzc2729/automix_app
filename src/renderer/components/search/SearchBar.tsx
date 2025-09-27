import * as React from "react";
import { Input } from "@renderer/components/ui/input";
import { Button } from "@renderer/components/ui/button";
import { SearchResult, Track } from "@shared/types";

export type SearchBarProps = {
  onSearch: (query: string) => Promise<SearchResult>;
  onAddTrack: (track: Track) => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onAddTrack }) => {
  const [query, setQuery] = React.useState("house");
  const [results, setResults] = React.useState<SearchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await onSearch(query);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-muted/40 bg-black/30 p-4 shadow">
      <form className="flex items-center gap-3" onSubmit={handleSubmit}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search YouTube tracks"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
        {results?.tracks.map((track) => (
          <button
            key={track.videoId}
            onClick={() => onAddTrack(track)}
            className="rounded-lg border border-transparent bg-foreground/5 p-3 text-left transition hover:border-accent/60 hover:bg-foreground/10"
          >
            <div className="text-sm font-medium text-foreground/90">{track.title}</div>
            <div className="text-xs text-foreground/50">
              {track.features?.bpm ? `${track.features.bpm} BPM` : "?"} • {track.features?.key ?? "?"}
            </div>
          </button>
        ))}
        {!results?.tracks?.length && !loading ? (
          <div className="text-sm text-foreground/50">Search to populate results.</div>
        ) : null}
      </div>
    </div>
  );
};
