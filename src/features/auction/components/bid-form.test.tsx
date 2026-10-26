import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeBidRejected } from "../test-support/fixtures";
import { BidForm } from "./bid-form";

function renderForm(overrides: Partial<React.ComponentProps<typeof BidForm>> = {}) {
  const onSubmit = vi.fn<(amount: number) => Promise<void>>(() =>
    Promise.resolve(),
  );
  const onDismissRejection = vi.fn();

  render(
    <BidForm
      minimumNextBid={1_050}
      minimumIncrement={50}
      disabled={false}
      rejection={null}
      onSubmit={onSubmit}
      onDismissRejection={onDismissRejection}
      {...overrides}
    />,
  );

  return {
    onSubmit,
    onDismissRejection,
    input: screen.getByLabelText("Teklifiniz"),
    submit: screen.getByRole("button", { name: "Teklif ver" }),
  };
}

describe("BidForm", () => {
  it("shows the floor the server reported", () => {
    renderForm();

    expect(
      screen.getByText(/En az .*1\.050 verebilirsiniz/),
    ).toBeInTheDocument();
  });

  it("submits the amount as a number", async () => {
    const user = userEvent.setup();
    const { input, submit, onSubmit } = renderForm();

    await user.type(input, "1200");
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith(1_200);
  });

  it("clears the field once the invocation leaves the client", async () => {
    const user = userEvent.setup();
    const { input, submit } = renderForm();

    await user.type(input, "1200");
    await user.click(submit);

    expect(input).toHaveValue(null);
  });

  it("refuses an empty or non-positive amount without calling the hub", async () => {
    const user = userEvent.setup();
    const { submit, onSubmit } = renderForm();

    await user.click(submit);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Geçerli bir tutar girin.")).toBeInTheDocument();
  });

  it("surfaces a failed invocation, such as bidding while disconnected", async () => {
    const user = userEvent.setup();
    const { input, submit } = renderForm({
      onSubmit: vi.fn(() => Promise.reject(new Error("Bağlantı hazır değil"))),
    });

    await user.type(input, "1200");
    await user.click(submit);

    expect(screen.getByText("Bağlantı hazır değil")).toBeInTheDocument();
  });

  it("fills the field from a shortcut built on the server's minimum", async () => {
    const user = userEvent.setup();
    const { input } = renderForm();

    await user.click(screen.getByRole("button", { name: /\+1 artış/ }));

    expect(input).toHaveValue(1_100);
  });

  it("offers a one-click fix to the floor the rejection named", async () => {
    const user = userEvent.setup();
    const { input } = renderForm({
      rejection: makeBidRejected({ minimumRequired: 1_150 }),
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Teklif çok düşük");
    await user.click(screen.getByRole("button", { name: /yap$/ }));

    expect(input).toHaveValue(1_150);
  });

  it("omits the fix button when the server named no floor", () => {
    renderForm({
      rejection: makeBidRejected({
        errorCode: "already_highest_bidder",
        reason: "Zaten en yüksek teklif sizde",
        minimumRequired: null,
      }),
    });

    expect(
      screen.queryByRole("button", { name: /yap$/ }),
    ).not.toBeInTheDocument();
  });

  it("locks the form and explains why when bidding is closed", () => {
    const { input, submit } = renderForm({
      disabled: true,
      disabledReason: "Açık arttırma canlı değil, teklif alınmıyor.",
    });

    expect(input).toBeDisabled();
    expect(submit).toBeDisabled();
    expect(
      screen.getByText("Açık arttırma canlı değil, teklif alınmıyor."),
    ).toBeInTheDocument();
  });
});
