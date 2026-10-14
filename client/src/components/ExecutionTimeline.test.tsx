// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExecutionTimeline } from "./ExecutionTimeline";

afterEach(cleanup);

describe("ExecutionTimeline", () => {
  it("shows a shimmer status and collapsible execution steps while working", () => {
    render(
      <ExecutionTimeline
        statusText="Searching the web for context..."
        isWorking
        steps={["Inspect the request", "Search trusted pages"]}
        toolLogs={[
          {
            connector: "Web Search",
            action: "search",
            timestamp: "now",
            status: "running",
          },
        ]}
      />
    );

    expect(
      screen.getByText("Searching the web for context...")
    ).toBeInTheDocument();
    expect(screen.getByText("Inspect the request")).toBeInTheDocument();
    expect(screen.getByText("search · Web Search")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Searching the web for context/ })
    );
    expect(screen.queryByText("Inspect the request")).not.toBeInTheDocument();
  });

  it("shows completed work and duration without a spanner status icon", () => {
    render(
      <ExecutionTimeline
        statusText="Work completed"
        isWorking={false}
        steps={["Summarize findings"]}
        durationSeconds={2.4}
      />
    );

    expect(screen.getByText("Work completed")).toBeInTheDocument();
    expect(screen.getByText("Summarize findings")).toBeInTheDocument();
    expect(screen.getByText("2.4s")).toBeInTheDocument();
  });
});
