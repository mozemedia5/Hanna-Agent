// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import IntegrationsPage from "./IntegrationsPage";

describe("IntegrationsPage Component", () => {
  it("renders Connectors & Integrations title and search bar", () => {
    render(<IntegrationsPage />);
    expect(screen.getByText("Connectors & Integrations")).toBeDefined();
    const searchInputs = screen.getAllByPlaceholderText("Search connectors and applications...");
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it("filters connector cards by search query", () => {
    render(<IntegrationsPage />);
    const searchInputs = screen.getAllByPlaceholderText("Search connectors and applications...");
    fireEvent.change(searchInputs[0], { target: { value: "Shopify" } });
    const shopifyElements = screen.getAllByText("Shopify");
    expect(shopifyElements.length).toBeGreaterThan(0);
  });

  it("opens 3-step OAuth modal upon clicking Connect", () => {
    render(<IntegrationsPage />);
    const connectButtons = screen.getAllByText("Connect");
    expect(connectButtons.length).toBeGreaterThan(0);
    fireEvent.click(connectButtons[0]);
    expect(screen.getByText("Requested Permissions:")).toBeDefined();
    expect(screen.getByText("Allow Access")).toBeDefined();
  });
});
