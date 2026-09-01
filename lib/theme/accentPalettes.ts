export type AccentColorKey =
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "orange"
  | "red"
  | "pink"
  | "fuchsia"
  | "purple";

export const ACCENT_COLOR_KEYS: readonly AccentColorKey[] = [
  "blue",
  "cyan",
  "teal",
  "green",
  "orange",
  "red",
  "pink",
  "fuchsia",
  "purple",
];

export const DEFAULT_ACCENT_COLOR: AccentColorKey = "blue";

export function isAccentColorKey(value: string): value is AccentColorKey {
  return (ACCENT_COLOR_KEYS as readonly string[]).includes(value);
}
