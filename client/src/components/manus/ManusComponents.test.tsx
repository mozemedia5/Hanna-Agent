// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TaskComposer } from "./TaskComposer";
import { ActivityLogTree } from "./ActivityLogTree";
import { VisualConnectorLoop } from "./VisualConnectorLoop";
import { VirtualComputerWindow } from "./VirtualComputerWindow";
import { AgentVoiceBubble } from "./AgentVoiceBubble";
import { Globe } from "lucide-react";

describe("Manus AI Frontend Components Unit Tests", () => {
  afterEach(() => {
    cleanup();
  });

  it("1. TaskComposer renders required placeholder and controls", () => {
    const handleAssignTask = vi.fn();
    render(<TaskComposer onAssignTask={handleAssignTask} />);

    // Check placeholder
    const textarea = screen.getByPlaceholderText("Assign a task or ask anything...");
    expect(textarea).toBeInTheDocument();

    // Check Operational Profiles
    expect(screen.getByText("Lite")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();

    // Check Arm Mode Chips
    expect(screen.getByText("Slides")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Meeting Minutes")).toBeInTheDocument();

    // Check Suggested Connector Cards
    expect(screen.getByText("Google Sheets Analytics")).toBeInTheDocument();
    expect(screen.getByText("Meta Ads Optimization")).toBeInTheDocument();
  });

  it("2. TaskComposer triggers task assignment with chosen profile and prompt", () => {
    const handleAssignTask = vi.fn();
    render(<TaskComposer onAssignTask={handleAssignTask} />);

    const textarea = screen.getByPlaceholderText("Assign a task or ask anything...");
    fireEvent.change(textarea, { target: { value: "Audit subscriber churn in Stripe" } });

    // Select Max profile
    fireEvent.click(screen.getByText("Max"));

    // Click submit button
    const submitBtn = screen.getByTitle("Assign task to Manus Agent");
    fireEvent.click(submitBtn);

    expect(handleAssignTask).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Audit subscriber churn in Stripe",
        profile: "Max",
      })
    );
  });

  it("3. ActivityLogTree displays structured goal and step nodes", () => {
    render(
      <ActivityLogTree
        goalTitle="Analyze ad campaign ROI"
        nodes={[
          { id: "step-1", label: "Inspect database", status: "completed", durationSeconds: 2 },
          { id: "step-2", label: "Run Python regression", status: "running", toolName: "Python Interpreter" },
        ]}
        totalDurationSeconds={5}
      />
    );

    expect(screen.getByText("Activity Log Tree")).toBeInTheDocument();
    expect(screen.getByText('Goal: "Analyze ad campaign ROI"')).toBeInTheDocument();
    expect(screen.getByText("Inspect database")).toBeInTheDocument();
    expect(screen.getByText("Run Python regression")).toBeInTheDocument();
    expect(screen.getByText("Python Interpreter")).toBeInTheDocument();
  });

  it("4. VisualConnectorLoop renders agent icon, status text, and connector icon", () => {
    render(
      <VisualConnectorLoop
        agentName="Manus AI Core"
        activeConnectorName="Google Sheets"
        activeConnectorIcon={Globe}
        statusText="Writing structured summary..."
        isLooping={true}
      />
    );

    expect(screen.getByText("Manus AI Core")).toBeInTheDocument();
    expect(screen.getByText("Google Sheets")).toBeInTheDocument();
    expect(screen.getByText("Writing structured summary...")).toBeInTheDocument();
  });

  it("5. VirtualComputerWindow renders titled computer frame and tab options", () => {
    render(
      <VirtualComputerWindow
        appName="Hanna"
        cursorPos={{ x: 30, y: 40, actionLabel: "Clicking search link..." }}
      />
    );

    expect(screen.getByText("Hanna's Computer Window")).toBeInTheDocument();
    expect(screen.getByText("Browser")).toBeInTheDocument();
    expect(screen.getByText("Python Code")).toBeInTheDocument();
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
    expect(screen.getByText("Clicking search link...")).toBeInTheDocument();
  });

  it("6. AgentVoiceBubble displays task status speech and 'Skip to Results' button", () => {
    const handleSkip = vi.fn();
    render(
      <AgentVoiceBubble
        statusText="Step 2/4: Reading competitor pricing pages..."
        stepProgressText="Step 2/4"
        onSkipToResults={handleSkip}
      />
    );

    expect(screen.getByText("Step 2/4: Reading competitor pricing pages...")).toBeInTheDocument();
    const skipBtn = screen.getByText("Skip to Results");
    expect(skipBtn).toBeInTheDocument();

    fireEvent.click(skipBtn);
    expect(handleSkip).toHaveBeenCalledTimes(1);
  });
});
