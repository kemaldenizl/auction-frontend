import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeBid } from "../test-support/fixtures";
import { BidFeed } from "./bid-feed";

describe("BidFeed", () => {
  it("invites the first bid when the feed is empty", () => {
    render(<BidFeed bids={[]} bidderId="u-alice" />);

    expect(screen.getByText("Henüz teklif yok")).toBeInTheDocument();
  });

  it("renders the bids in the order given, newest first", () => {
    render(
      <BidFeed
        bids={[
          makeBid({ id: "b2", amount: 1_100, bidderName: "Bob" }),
          makeBid({ id: "b1", amount: 1_000, bidderName: "Alice" }),
        ]}
        bidderId="u-nobody"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("1.100,00");
    expect(items[1]).toHaveTextContent("1.000,00");
  });

  it("marks the viewer's own bids", () => {
    render(
      <BidFeed
        bids={[
          makeBid({ id: "b2", bidderId: "u-alice", bidderName: "Alice" }),
          makeBid({ id: "b1", bidderId: "u-bob", bidderName: "Bob" }),
        ]}
        bidderId="u-alice"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Alice (siz)");
    expect(items[1]).not.toHaveTextContent("(siz)");
  });
});
