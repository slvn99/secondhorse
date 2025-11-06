import React from "react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlobalError from "@/app/error";
import { renderElement } from "../setup";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

describe("app/error.tsx", () => {
  const sampleError = new Error("Test explosion");

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders friendly messaging and action buttons", () => {
    renderElement(<GlobalError error={sampleError} reset={() => undefined} />);
    const heading = screen.getByRole("heading", { name: /hold your horses/i });
    const retryButtons = screen.getAllByRole("button", { name: /try again/i });
    const homeLink = screen.getByRole("link", { name: /back to homepage/i });
    expect(heading).toBeTruthy();
    expect(retryButtons.length).toBeGreaterThan(0);
    expect(homeLink.getAttribute("href")).toBe("/");
  });

  it("invokes reset when the retry button is clicked", async () => {
    const reset = vi.fn();
    renderElement(<GlobalError error={sampleError} reset={reset} />);
    const user = userEvent.setup();
    const buttons = screen.getAllByRole("button", { name: /try again/i });
    for (const button of buttons) {
      await user.click(button);
    }
    expect(reset).toHaveBeenCalled();
  });

  it("logs the captured error without leaking details in the UI", () => {
    renderElement(<GlobalError error={sampleError} reset={() => undefined} />);
    expect(console.error).toHaveBeenCalledWith(
      "App error boundary captured an error:",
      sampleError
    );
    expect(screen.queryByText(sampleError.message)).toBeNull();
  });
});
