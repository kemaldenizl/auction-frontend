/**
 * Who you are in the room. Until the backend gets JWT auth, the id and name
 * travel as query parameters on the hub URL and in REST bid bodies. Once a
 * token exists the server reads the identity from it and these drop out — see
 * `signalr-auction-hub.ts`.
 */
export interface Bidder {
  id: string;
  name: string;
}
