import { formatMoney } from "@/shared/lib/format";
import { Alert, Button } from "@/shared/ui";

import type { OutbidEvent } from "../model/hub-events";

/** Reacts to `Outbid`, which the server sends only to the displaced bidder. */
export function OutbidAlert({
  outbid,
  onDismiss,
}: {
  outbid: OutbidEvent;
  onDismiss: () => void;
}) {
  return (
    <Alert
      role="alert"
      tone="warning"
      title="Teklifiniz geçildi"
      action={
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Kapat
        </Button>
      }
    >
      <p>
        {formatMoney(outbid.yourBid)} → {formatMoney(outbid.newPrice)} ·{" "}
        {outbid.newLeaderName}
      </p>
      <p className="mt-0.5">
        Yeniden öne geçmek için en az {formatMoney(outbid.minimumNextBid)}.
      </p>
    </Alert>
  );
}
