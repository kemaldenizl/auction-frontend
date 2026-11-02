"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  auctionRoomReducer,
  canPlaceBid,
  createInitialState,
  isLeading,
  isLive,
  type AuctionRoomAction,
  type AuctionRoomState,
} from "../model/auction-room";
import {
  HubNotReadyError,
  type AuctionHub,
  type AuctionHubFactory,
} from "../realtime/auction-hub";
import { createSignalRAuctionHub } from "../realtime/signalr-auction-hub";

export interface UseAuctionRoomOptions {
  /**
   * Rebuilds the connection when it changes. Pass the session id: signing in
   * or out changes the token the hub authenticates with, and the hub is
   * `[Authorize]`d, so the old connection is no longer the right one.
   */
  sessionKey?: string;
  /**
   * Transport factory. Must be referentially stable — it is an effect
   * dependency, so a new function on every render would tear the socket down
   * and rebuild it each time. Tests pass a fake hub through here.
   */
  createHub?: AuctionHubFactory;
}

export interface AuctionRoom extends AuctionRoomState {
  placeBid: (amount: number) => Promise<void>;
  dismissOutbid: () => void;
  dismissRejection: () => void;
  isLive: boolean;
  isLeading: boolean;
  canBid: boolean;
}

export function useAuctionRoom(
  auctionId: string,
  {
    sessionKey = "",
    createHub = createSignalRAuctionHub,
  }: UseAuctionRoomOptions = {},
): AuctionRoom {
  const [state, dispatch] = useReducer(
    auctionRoomReducer,
    auctionId,
    createInitialState,
  );

  const hubRef = useRef<AuctionHub | null>(null);

  useEffect(() => {
    let disposed = false;
    const now = () => Date.now();

    dispatch({ type: "room/reset", auctionId, at: now() });

    const hub = createHub();
    hubRef.current = hub;

    // A hub that has been torn down still fires until `stop()` settles. Its
    // events belong to a connection this room no longer owns, so they must not
    // reach the reducer — in StrictMode the replacement effect is already
    // running by then, and the old socket's `onclose` would land on it.
    const emit = (action: AuctionRoomAction) => {
      if (disposed) return;
      dispatch(action);
    };

    const reportFailure = (error: unknown) => {
      emit({
        type: "connection/failed",
        message:
          error instanceof Error ? error.message : "Bilinmeyen bağlantı hatası",
        at: now(),
      });
    };

    const join = async () => {
      const auction = await hub.join(auctionId);
      emit({ type: "room/joined", auction, at: now() });
    };

    const identify = async () => {
      const viewer = await hub.whoAmI();
      emit({ type: "room/identified", viewer, at: now() });
    };

    // Every listener dispatches, so the reducer — not a stale closure — owns
    // the state transition. Reading state directly here would capture the
    // first render's value for the whole life of the effect.
    hub.on("BidPlaced", (event) => {
      emit({ type: "hub/bid-placed", event, at: now() });
    });
    hub.on("BidRejected", (event) => {
      emit({ type: "hub/bid-rejected", event, at: now() });
    });
    hub.on("Outbid", (event) => {
      emit({ type: "hub/outbid", event, at: now() });
    });
    hub.on("AuctionStarted", (event) => {
      emit({ type: "hub/auction-started", event, at: now() });
    });
    hub.on("AuctionEnded", (event) => {
      emit({ type: "hub/auction-ended", event, at: now() });
    });
    hub.on("AuctionCancelled", (event) => {
      emit({ type: "hub/auction-cancelled", event, at: now() });
    });
    hub.on("ViewerCountChanged", (event) => {
      emit({ type: "hub/viewer-count", event, at: now() });
    });

    hub.onReconnecting(() => {
      emit({ type: "connection/changed", status: "reconnecting", at: now() });
    });

    hub.onClose(() => {
      emit({ type: "connection/changed", status: "disconnected", at: now() });
    });

    hub.onReconnected(() => {
      emit({ type: "connection/changed", status: "connected", at: now() });
      // Rejoining is not optional. A reconnect gets a new ConnectionId and the
      // server-side group membership is gone with the old one: the connection
      // reads as "connected" while no event ever arrives again. The same call
      // also returns whatever was missed while the socket was down.
      void join().catch(reportFailure);
    });

    const started = hub
      .start()
      .then(() => {
        if (disposed) return;
        emit({ type: "connection/changed", status: "connected", at: now() });
        return Promise.all([join(), identify()]);
      })
      .catch(reportFailure);

    return () => {
      disposed = true;
      hubRef.current = null;
      // StrictMode runs effects twice in development (mount -> cleanup ->
      // mount). Calling stop() while start() is still in flight throws, so
      // wait for start to settle first. Leaving the group before stopping is
      // tidy rather than required — the server drops the connection anyway.
      void started
        .catch(() => {})
        .then(() => (hub.isConnected() ? hub.leave(auctionId) : undefined))
        .catch(() => {})
        .then(() => hub.stop());
    };
  }, [auctionId, sessionKey, createHub]);

  const placeBid = useCallback(
    async (amount: number) => {
      const hub = hubRef.current;
      if (!hub?.isConnected()) throw new HubNotReadyError();

      dispatch({ type: "bid/submitted", amount, at: Date.now() });
      await hub.placeBid(auctionId, amount);
    },
    [auctionId],
  );

  const dismissOutbid = useCallback(() => {
    dispatch({ type: "outbid/dismissed", at: Date.now() });
  }, []);

  const dismissRejection = useCallback(() => {
    dispatch({ type: "rejection/dismissed", at: Date.now() });
  }, []);

  return useMemo(
    () => ({
      ...state,
      placeBid,
      dismissOutbid,
      dismissRejection,
      isLive: isLive(state),
      isLeading: isLeading(state),
      canBid: canPlaceBid(state),
    }),
    [state, placeBid, dismissOutbid, dismissRejection],
  );
}
