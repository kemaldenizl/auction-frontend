import { cn } from "@/shared/lib/cn";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/shared/ui";
import type { BadgeTone } from "@/shared/ui";

import type { HubLogEntry, LogChannel } from "../model/auction-room";

const CHANNEL_TONE: Record<LogChannel, BadgeTone> = {
  event: "brand",
  connection: "info",
  invocation: "warning",
};

const CHANNEL_LABEL: Record<LogChannel, string> = {
  event: "olay",
  connection: "bağlantı",
  invocation: "çağrı",
};

const time = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Raw hub traffic, newest first. This panel exists to make SignalR visible:
 * which events arrive, in what order, and what a reconnect actually does.
 */
export function HubEventLog({ entries }: { entries: HubLogEntry[] }) {
  return (
    <Card>
      <CardHeader
        title="Hub günlüğü"
        description="Gelen olaylar ve giden çağrılar"
      />
      <CardBody className="p-0">
        {entries.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Henüz trafik yok" />
          </div>
        ) : (
          <ol className="max-h-80 divide-y divide-line overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 px-4 py-2 text-xs"
              >
                <time className="shrink-0 tabular text-subtle">
                  {time.format(entry.at)}
                </time>
                <Badge tone={CHANNEL_TONE[entry.channel]}>
                  {CHANNEL_LABEL[entry.channel]}
                </Badge>
                <div className="min-w-0">
                  <p className={cn("font-mono font-medium text-fg")}>
                    {entry.name}
                  </p>
                  {entry.summary && (
                    <p className="truncate text-subtle">{entry.summary}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
