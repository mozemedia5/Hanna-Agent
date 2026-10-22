// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
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

    expect(screen.getByText("search · Web Search")).toBeInTheDocument();
    expect(screen.queryByText("Inspect the request")).not.toBeInTheDocument();
  });

  it("shows the completed tool on one line with its duration", () => {
    render(
      <ExecutionTimeline
        statusText="Response ready"
        isWorking={false}
        steps={["Summarize findings"]}
        durationSeconds={2.4}
      />
    );

    expect(screen.getByText("Summarize findings completed")).toBeInTheDocument();
    expect(screen.getByText("2.4s")).toBeInTheDocument();
  });
});
