import type { AuctionDetail } from "../model/auction";
import type {
  AuctionHub,
  HubEventMap,
  HubEventName,
} from "../realtime/auction-hub";

/**
 * Handlers are stored with an opaque payload: a single mapped type keyed by
 * event name collapses to `never` once indexed by a type parameter. The cast
 * lives at the two boundaries below and nowhere else.
 */
type OpaqueHandler = (payload: unknown) => void;

/**
 * In-memory stand-in for the SignalR hub.
 *
 * Lets a test drive the parts that are otherwise hard to reach: a reconnect
 * (and whether the room rejoins the group afterwards), a dropped connection,
 * and events arriving in a chosen order.
 */
export class FakeAuctionHub implements AuctionHub {
  snapshot: AuctionDetail;
  connected = false;
  startRejection: Error | null = null;

  readonly joinCalls: string[] = [];
  readonly placeBidCalls: { auctionId: string; amount: number }[] = [];
  stopCalls = 0;

  private readonly handlers = new Map<HubEventName, OpaqueHandler[]>();
  private readonly reconnectingHandlers: (() => void)[] = [];
  private readonly reconnectedHandlers: (() => void)[] = [];
  private readonly closeHandlers: (() => void)[] = [];

  constructor(snapshot: AuctionDetail) {
    this.snapshot = snapshot;
  }

  async start(): Promise<void> {
    if (this.startRejection) throw this.startRejection;
    this.connected = true;
  }

  async stop(): Promise<void> {
    this.connected = false;
    this.stopCalls += 1;
  }

  async join(auctionId: string): Promise<AuctionDetail> {
    this.joinCalls.push(auctionId);
    return this.snapshot;
  }

  async placeBid(auctionId: string, amount: number): Promise<void> {
    this.placeBidCalls.push({ auctionId, amount });
  }

  isConnected(): boolean {
    return this.connected;
  }

  on<K extends HubEventName>(
    event: K,
    handler: (payload: HubEventMap[K]) => void,
  ): void {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler as OpaqueHandler);
    this.handlers.set(event, existing);
  }

  onReconnecting(handler: () => void): void {
    this.reconnectingHandlers.push(handler);
  }

  onReconnected(handler: () => void): void {
    this.reconnectedHandlers.push(handler);
  }

  onClose(handler: () => void): void {
    this.closeHandlers.push(handler);
  }

  // ---- test drivers ----

  emit<K extends HubEventName>(event: K, payload: HubEventMap[K]): void {
    for (const handler of this.handlers.get(event) ?? []) handler(payload);
  }

  dropConnection(): void {
    this.connected = false;
    for (const handler of this.reconnectingHandlers) handler();
  }

  restoreConnection(): void {
    this.connected = true;
    for (const handler of this.reconnectedHandlers) handler();
  }

  close(): void {
    this.connected = false;
    for (const handler of this.closeHandlers) handler();
  }
}
