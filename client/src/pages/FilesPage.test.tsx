// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import FilesPage, {
  getFileTypeBadgeLabel,
  loadStoredFiles,
  saveStoredFiles,
  addStoredFiles,
  type StoredFileItem,
} from "./FilesPage";

describe("FilesPage & Workspace Files Library Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns clean file type badge labels without raw filenames", () => {
    expect(getFileTypeBadgeLabel("image")).toBe("Image");
    expect(getFileTypeBadgeLabel("video")).toBe("Video Slot");
    expect(getFileTypeBadgeLabel("audio")).toBe("Audio Recording");
    expect(getFileTypeBadgeLabel("pdf")).toBe("PDF Document");
    expect(getFileTypeBadgeLabel("doc")).toBe("Document");
    expect(getFileTypeBadgeLabel("other")).toBe("File Asset");
  });

  it("persists and retrieves files in localStorage", () => {
    const mockFiles: StoredFileItem[] = [
      {
        id: "f1",
        type: "image",
        url: "data:image/png;base64,123",
        size: "1.2 MB",
        uploadedAt: "Uploaded today at 10:00 AM",
        category: "Image",
      },
      {
        id: "f2",
        type: "pdf",
        url: "data:application/pdf;base64,456",
        size: "500 KB",
        uploadedAt: "Uploaded today at 10:15 AM",
        category: "Document",
      },
    ];

    saveStoredFiles(mockFiles);
    const loaded = loadStoredFiles();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe("f1");

    addStoredFiles([
      {
        id: "f3",
        type: "video",
        url: "data:video/mp4;base64,789",
        size: "4.5 MB",
        uploadedAt: "Uploaded today at 10:30 AM",
        category: "Video",
      },
    ]);

    const updated = loadStoredFiles();
    expect(updated).toHaveLength(3);
    expect(updated[0].id).toBe("f3");
  });

  it("renders FilesPage component header, category filters, and empty state", () => {
    render(<FilesPage />);

    expect(screen.getByText("Media & Files Library")).toBeInTheDocument();
    expect(screen.getByText("All Files (0)")).toBeInTheDocument();
    expect(screen.getByText("Images (0)")).toBeInTheDocument();
    expect(screen.getByText("Videos (0)")).toBeInTheDocument();
    expect(screen.getByText("Audio (0)")).toBeInTheDocument();
    expect(screen.getByText("Documents (0)")).toBeInTheDocument();
    expect(screen.getByText("No Files in Workspace")).toBeInTheDocument();
  });

  it("renders file items displaying clean type badges and upload timestamps without raw file names", () => {
    const mockItems: StoredFileItem[] = [
      {
        id: "item_img",
        type: "image",
        url: "http://example.com/image.png",
        size: "2.1 MB",
        uploadedAt: "Uploaded today at 11:00 AM",
        category: "Image",
      },
      {
        id: "item_vid",
        type: "video",
        url: "http://example.com/video.mp4",
        size: "12.0 MB",
        uploadedAt: "Uploaded today at 11:30 AM",
        category: "Video",
      },
    ];

    saveStoredFiles(mockItems);

    render(<FilesPage />);

    // Should display type badges and size/upload timestamp
    expect(screen.getByText("All Files (2)")).toBeInTheDocument();
    expect(screen.getByText("2.1 MB • Uploaded today at 11:00 AM")).toBeInTheDocument();
    expect(screen.getByText("12.0 MB • Uploaded today at 11:30 AM")).toBeInTheDocument();

    // Verify raw file names like image.png or video.mp4 do NOT appear as text nodes
    expect(screen.queryByText("image.png")).not.toBeInTheDocument();
    expect(screen.queryByText("video.mp4")).not.toBeInTheDocument();
  });
});
