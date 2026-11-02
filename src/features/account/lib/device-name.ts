export type DeviceKind = "desktop" | "mobile" | "other";

export interface DeviceDescription {
  label: string;
  kind: DeviceKind;
}

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string, DeviceKind][] = [
  [/iPhone|iPad|iPod/, "iOS", "mobile"],
  [/Android/, "Android", "mobile"],
  [/Mac OS X|Macintosh/, "macOS", "desktop"],
  [/Windows/, "Windows", "desktop"],
  [/Linux/, "Linux", "desktop"],
];

/**
 * Turns a raw user-agent string into "Chrome · macOS".
 *
 * The session list stores whatever the client sent, which for a browser is a
 * long technical string and for scripts and tools is something like
 * `curl/8.7.1` — neither is anything a user should have to decode.
 */
export function describeDevice(userAgent: string | null): DeviceDescription {
  if (!userAgent) return { label: "Bilinmeyen cihaz", kind: "other" };

  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent));
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent));

  if (browser || system) {
    const parts = [browser?.[1], system?.[1]].filter(Boolean);
    return { label: parts.join(" · "), kind: system?.[2] ?? "desktop" };
  }

  return { label: "Diğer uygulama", kind: "other" };
}
