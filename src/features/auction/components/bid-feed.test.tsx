import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeBid } from "../test-support/fixtures";
import { BidFeed } from "./bid-feed";

describe("BidFeed", () => {
  it("invites the first bid when the feed is empty", () => {
    render(<BidFeed bids={[]} viewerId="u-alice" />);

    expect(screen.getByText("Henüz teklif yok")).toBeInTheDocument();
  });

  it("renders the bids in the order given, newest first", () => {
    render(
      <BidFeed
        bids={[
          makeBid({ id: "b2", amount: 1_100 }),
          makeBid({ id: "b1", amount: 1_000 }),
        ]}
        viewerId="u-nobody"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("1.100");
    expect(items[1]).toHaveTextContent("1.000");
  });

  it("crowns only the leading bid", () => {
    render(
      <BidFeed
        bids={[makeBid({ id: "b2" }), makeBid({ id: "b1" })]}
        viewerId={null}
      />,
    );

    expect(screen.getAllByLabelText("En yüksek teklif")).toHaveLength(1);
  });

  it("shows your own address in full and masks everyone else's", () => {
    // The backend sends the bidder's e-mail as their display name; showing
    // other people's in full would leak addresses.
    render(
      <BidFeed
        bids={[
          makeBid({
            id: "b2",
            bidderId: "u-alice",
            bidderName: "alice@example.com",
          }),
          makeBid({
            id: "b1",
            bidderId: "u-bob",
            bidderName: "bob@example.com",
          }),
        ]}
        viewerId="u-alice"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("alice@example.com (siz)");
    expect(items[1]).toHaveTextContent("b***@example.com");
    expect(items[1]).not.toHaveTextContent("bob@example.com");
  });

  it("masks every bidder when nobody is signed in", () => {
    render(
      <BidFeed
        bids={[makeBid({ bidderName: "ayse@example.com" })]}
        viewerId={null}
      />,
    );

    expect(screen.getByText("a***@example.com")).toBeInTheDocument();
  });
});
