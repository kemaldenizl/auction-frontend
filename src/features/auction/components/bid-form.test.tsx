import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";

import { HubNotReadyError } from "../realtime/auction-hub";
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
    submit: screen.getByRole("button", { name: /Teklif ver/ }),
  };
}

function tooLow(): ApiError {
  return new ApiError({
    title: "İş kuralı ihlali",
    status: 409,
    detail: "Bid too low. Minimum is 1,150.00.",
    errorCode: "bid_too_low",
    traceId: "trace-1",
    minimumRequired: 1_150,
  });
}

describe("BidForm", () => {
  it("shows the floor the server reported", () => {
    renderForm();

    expect(
      screen.getByText(/En az .*1\.050 teklif verebilirsiniz/),
    ).toBeInTheDocument();
  });

  it("submits the amount as a number", async () => {
    const user = userEvent.setup();
    const { input, submit, onSubmit } = renderForm();

    await user.type(input, "1200");
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith(1_200);
  });

  it("clears the field once the bid is on its way", async () => {
    const user = userEvent.setup();
    const { input, submit } = renderForm();

    await user.type(input, "1200");
    await user.click(submit);

    expect(input).toHaveValue(null);
  });

  it("refuses an empty amount without sending anything", async () => {
    const user = userEvent.setup();
    const { submit, onSubmit } = renderForm();

    await user.click(submit);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Lütfen geçerli bir tutar girin.")).toBeInTheDocument();
  });

  it("explains a bid sent before the connection is ready", async () => {
    const user = userEvent.setup();
    const { input, submit } = renderForm({
      onSubmit: vi.fn(() => Promise.reject(new HubNotReadyError())),
    });

    await user.type(input, "1200");
    await user.click(submit);

    expect(screen.getByRole("alert")).toHaveTextContent(/Bağlantı henüz hazır değil/);
  });

  it("describes an unexpected failure generically, not with its raw text", async () => {
    const user = userEvent.setup();
    const { input, submit } = renderForm({
      onSubmit: vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    });

    await user.type(input, "1200");
    await user.click(submit);

    expect(screen.getByRole("alert")).not.toHaveTextContent("Failed to fetch");
    expect(screen.getByRole("alert")).toHaveTextContent(/gönderilemedi/);
  });

  it("fills the field from a shortcut built on the server's minimum", async () => {
    const user = userEvent.setup();
    const { input } = renderForm();

    await user.click(screen.getByRole("button", { name: /\+1 adım/ }));

    expect(input).toHaveValue(1_100);
  });

  it("offers a one-click fix to the floor a live rejection named", async () => {
    const user = userEvent.setup();
    const { input } = renderForm({
      rejection: makeBidRejected({ minimumRequired: 1_150 }),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Teklifiniz çok düşük\. En az .*1\.150 vermelisiniz/,
    );
    await user.click(screen.getByRole("button", { name: /yap$/ }));

    expect(input).toHaveValue(1_150);
  });

  it("omits the fix button when the server named no floor", () => {
    renderForm({
      rejection: makeBidRejected({
        errorCode: "already_highest_bidder",
        reason: "Already the highest bidder.",
        minimumRequired: null,
      }),
    });

    expect(screen.getByRole("alert")).toHaveTextContent("En yüksek teklif zaten sizde.");
    expect(
      screen.queryByRole("button", { name: /yap$/ }),
    ).not.toBeInTheDocument();
  });

  it("offers the same fix when the fallback request reports the floor", async () => {
    // The request answers with the same errorCode and minimumRequired the
    // live event carries, so both refusals render identically.
    const user = userEvent.setup();
    const { input, submit } = renderForm({
      onSubmit: vi.fn(() => Promise.reject(tooLow())),
    });

    await user.type(input, "100");
    await user.click(submit);

    await user.click(screen.getByRole("button", { name: /yap$/ }));
    expect(input).toHaveValue(1_150);
  });

  it("never shows codes or the server's own wording", async () => {
    const user = userEvent.setup();
    const { input, submit } = renderForm({
      onSubmit: vi.fn(() => Promise.reject(tooLow())),
    });

    await user.type(input, "100");
    await user.click(submit);

    const alert = screen.getByRole("alert");
    expect(alert).not.toHaveTextContent("bid_too_low");
    expect(alert).not.toHaveTextContent("Bid too low");
  });

  it("locks the form and explains why when bidding is closed", () => {
    const { input, submit } = renderForm({
      disabled: true,
      disabledReason: "Bu açık artırma sona erdi.",
    });

    expect(input).toBeDisabled();
    expect(submit).toBeDisabled();
    expect(screen.getByText("Bu açık artırma sona erdi.")).toBeInTheDocument();
  });
});
