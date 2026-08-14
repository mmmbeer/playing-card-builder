import type { Metadata } from "next";
import BuilderClient from "./BuilderClient";

export const metadata: Metadata = {
  title: "Playing Card Builder",
  description: "Create a custom deck of playing cards, add artwork, tune the layout, and export print-ready PNG files.",
  alternates: { canonical: "/builder" },
};

export default function BuilderPage() { return <BuilderClient />; }
