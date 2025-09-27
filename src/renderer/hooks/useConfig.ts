import * as React from "react";

export const useConfig = () => {
  const [apiBaseUrl, setApiBaseUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const bridge = (window as Window & { automix?: Window["automix"] }).automix;

    if (!bridge) {
      setError("Automix bridge unavailable");
      return () => {
        mounted = false;
      };
    }

    bridge
      .getConfig()
      .then((config) => {
        if (mounted) setApiBaseUrl(config.apiBaseUrl);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to read config");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { apiBaseUrl, error };
};
