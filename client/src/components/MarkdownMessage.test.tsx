// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => cleanup());
import MarkdownMessage from "./MarkdownMessage";

describe("MarkdownMessage", () => {
  it("renders GFM content and highlighted fenced code with a language label", () => {
    render(
      <MarkdownMessage
        content={
          "## Plan\n\n- one\n- two\n\n```ts\nconst answer: number = 42;\n```"
        }
      />
    );
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("ts")).toBeInTheDocument();
    expect(document.querySelector("code.language-ts")).toBeInTheDocument();
  });

  it("copies a generated code block and shows copied feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MarkdownMessage content={'```js\nconsole.log("hello");\n```'} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('console.log("hello");')
    );
    expect(screen.getByRole("button", { name: "Copy code" })).toHaveTextContent(
      "Copied"
    );
  });
});
