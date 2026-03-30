import type { Metadata } from "next";
import VisitorAuthClient from "../VisitorAuthClient";

export const metadata: Metadata = {
  title: "BJMP | Visitor Portal",
  description: "Visitor authentication portal for BJMP facility visits",
};

export default function VisitorLoginPage() {
  return <VisitorAuthClient />;
}
