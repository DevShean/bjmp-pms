import type { Metadata } from "next";
import AdminAuthClient from "./AdminAuthClient";

export const metadata: Metadata = {
  title: "BJMP | Staff Authentication",
  description: "Staff authentication portal for BJMP personnel",
};

export default function AdminLoginPage() {
  return <AdminAuthClient />;
}
