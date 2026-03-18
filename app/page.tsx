import type { Metadata } from "next";
import VisitorAuthClient from "./VisitorAuthClient";

export const metadata: Metadata = {
  title: "BJMP | Visitor Authentication",
  description: "Visitor registration and authentication portal for BJMP facilities",
};

export default function Home() {
  return <VisitorAuthClient />;
}

