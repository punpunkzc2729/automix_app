import * as React from "react";
import { useConfig } from "@renderer/hooks/useConfig";
import { SearchBar } from "@renderer/components/search/SearchBar";
import { DeckPreview } from "@renderer/components/decks/DeckPreview";
import { PlannerList } from "@renderer/components/planner/PlannerList";
import { Crossfader } from "@renderer/components/mixer/Crossfader";
import { TransportControls } from "@renderer/components/transport/TransportControls";
import { Button } from "@renderer/components/ui/button";
import { Card } from "@renderer/components/ui/card";
import { PlanRequest, PlanResponse, Track, AutomixIntent, MixerState, SearchResult } from "@shared/types";

const buildPlanRequest = (playlist: Track[]): PlanRequest => ({
  playlist,
  target: {
    energy: 6
  },
  context: {}
});

export const App: React.FC = () => {
  const { apiBaseUrl, error: configError } = useConfig();
  const [playlist, setPlaylist] = React.useState<Track[]>([]);
  const [plan, setPlan] = React.useState<PlanResponse | null>(null);
  const [loadingPlan, setLoadingPlan] = React.useState(false);
  const [planError, setPlanError] = React.useState<string | null>(null);
  const [playbackState, setPlaybackState] = React.useState<MixerState | null>(null);

  const fetchPlaybackState = React.useCallback(async () => {
    if (!apiBaseUrl) return;
    const response = await fetch(`${apiBaseUrl}/api/playback/state`);
    if (!response.ok) {
      throw new Error("Failed to read playback state");
    }
    const state = (await response.json()) as MixerState;
    setPlaybackState(state);
  }, [apiBaseUrl]);

  React.useEffect(() => {
    if (!apiBaseUrl) return;
    fetchPlaybackState().catch((err) => console.error(err));
  }, [apiBaseUrl, fetchPlaybackState]);

  const handleSearch = React.useCallback(
    async (query: string): Promise<SearchResult> => {
      if (!apiBaseUrl) throw new Error("API unavailable");
      const response = await fetch(`${apiBaseUrl}/api/yt/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      return (await response.json()) as SearchResult;
    },
    [apiBaseUrl]
  );

  const handleAddTrack = React.useCallback((track: Track) => {
    setPlaylist((current) => {
      const exists = current.some((item) => item.videoId === track.videoId);
      if (exists) return current;
      return [...current, track];
    });
  }, []);

  const handleRemoveTrack = React.useCallback((videoId: string) => {
    setPlaylist((current) => current.filter((track) => track.videoId !== videoId));
  }, []);

  const postIntent = React.useCallback(
    async (intent: AutomixIntent) => {
      if (!apiBaseUrl) return;
      await fetch(`${apiBaseUrl}/api/playback/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent })
      });
      await fetchPlaybackState().catch((err) => console.error(err));
    },
    [apiBaseUrl, fetchPlaybackState]
  );

  const handleGeneratePlan = React.useCallback(async () => {
    if (!apiBaseUrl || !playlist.length) return;
    setLoadingPlan(true);
    setPlanError(null);
    try {
      const request = buildPlanRequest(playlist);
      const response = await fetch(`${apiBaseUrl}/api/llm/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request })
      });
      if (!response.ok) throw new Error("Planner failed");
      const nextPlan = (await response.json()) as PlanResponse;
      setPlan(nextPlan);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Planner error");
    } finally {
      setLoadingPlan(false);
    }
  }, [apiBaseUrl, playlist]);

  const handleCrossfaderChange = React.useCallback(
    async (value: number) => {
      if (!apiBaseUrl) return;
      setPlaybackState((state) => (state ? { ...state, crossfader: value } : state));
      await fetch(`${apiBaseUrl}/api/playback/crossfader`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value })
      });
    },
    [apiBaseUrl]
  );

  const handleEnergyChange = React.useCallback(
    (value: number) => {
      setPlaybackState((state) => (state ? { ...state, energy: value } : state));
      void postIntent({ intent: "set_energy", params: { value } });
    },
    [postIntent]
  );

  if (configError) {
    return <div className="p-6 text-danger">{configError}</div>;
  }

  if (!apiBaseUrl) {
    return <div className="p-6 text-foreground/60">Booting automix services...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-background p-6 text-foreground">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Automix Control</h1>
          <p className="text-sm text-foreground/60">Blend YouTube tracks with intelligent transitions.</p>
        </div>
        <div className="text-xs text-foreground/50">API: {apiBaseUrl}</div>
      </header>

      <SearchBar onSearch={handleSearch} onAddTrack={handleAddTrack} />

      <div className="grid flex-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-muted/40 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">Playlist</h2>
              <Button onClick={handleGeneratePlan} disabled={loadingPlan || !playlist.length}>
                {loadingPlan ? "Planning..." : "Generate Automix"}
              </Button>
            </div>
            {planError ? <p className="text-sm text-danger">{planError}</p> : null}
            <div className="flex flex-col gap-2">
              {playlist.map((track, index) => (
                <div
                  key={track.videoId}
                  className="flex items-center justify-between rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground/80"
                >
                  <span>
                    {index + 1}. {track.title}
                  </span>
                  <button className="text-xs uppercase text-danger" onClick={() => handleRemoveTrack(track.videoId)}>
                    Remove
                  </button>
                </div>
              ))}
              {!playlist.length ? (
                <div className="rounded-lg bg-black/20 p-4 text-sm text-foreground/50">
                  Add tracks from search to start planning.
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DeckPreview label="Deck A" track={plan?.orderedTracks?.[0] ?? playlist[0]} isActive={playbackState?.activeDeck === "A"} />
            <DeckPreview label="Deck B" track={plan?.orderedTracks?.[1] ?? playlist[1]} isActive={playbackState?.activeDeck === "B"} />
          </div>

          <Card className="flex flex-col gap-4">
            <Crossfader value={playbackState?.crossfader ?? 0.5} onChange={handleCrossfaderChange} />
            <div className="grid grid-cols-2 gap-4 text-sm text-foreground/70">
              <div>
                <div className="uppercase tracking-wide text-xs text-foreground/60">Automix</div>
                <div>{playbackState?.automixEnabled ? "Enabled" : "Manual"}</div>
              </div>
              <div>
                <div className="uppercase tracking-wide text-xs text-foreground/60">Transport</div>
                <div>{Math.floor((playbackState?.transportPositionSec ?? 0) / 60)}:{`${Math.floor((playbackState?.transportPositionSec ?? 0) % 60)}`.padStart(2, "0")}</div>
              </div>
            </div>
          </Card>
        </div>

        <PlannerList plan={plan} />
      </div>

      <TransportControls
        onPlay={() => void postIntent({ intent: "play" })}
        onPause={() => void postIntent({ intent: "pause" })}
        onNext={() => void postIntent({ intent: "next" })}
        onPrev={() => void postIntent({ intent: "prev" })}
        onQuantize={(bars) => void postIntent({ intent: "jump_to_section", params: { section: `${bars}_bars` } })}
        energy={playbackState?.energy ?? 6}
        onEnergyChange={handleEnergyChange}
      />
    </div>
  );
};

export default App;
