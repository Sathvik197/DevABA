import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the Inkwell header", () => {
    render(<App />);
    expect(screen.getByText("Inkwell")).toBeInTheDocument();
  });

  it("renders the New Post form", () => {
    render(<App />);
    expect(screen.getByPlaceholderText("Post title")).toBeInTheDocument();
  });

  it("renders the Publish button", () => {
    render(<App />);
    expect(screen.getByText(/Publish/i)).toBeInTheDocument();
  });
});