type PerfContext = Record<string, string | number | boolean | null | undefined>;

function isEnabled() {
  return process.env.PERF_LOG === "true";
}

function formatContext(context?: PerfContext) {
  if (!context) return "";

  const entries = Object.entries(context).filter(([, value]) => value != null);
  if (entries.length === 0) return "";

  return ` ${entries.map(([k, v]) => `${k}=${String(v)}`).join(" ")}`;
}

export function startServerTimer(label: string, context?: PerfContext) {
  const startedAt = Date.now();

  return {
    end(extraContext?: PerfContext) {
      if (!isEnabled()) return;

      const elapsedMs = Date.now() - startedAt;
      const mergedContext = {
        ...(context ?? {}),
        ...(extraContext ?? {}),
      };

      console.info(
        `[perf] ${label} ${elapsedMs}ms${formatContext(mergedContext)}`,
      );
    },
  };
}
