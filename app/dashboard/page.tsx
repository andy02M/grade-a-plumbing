import type { Metadata } from "next";
import { DashboardClient } from "./AutomationDashboard";

export const metadata: Metadata = {
  title: "Automation Dashboard | GMB AutoPilot",
  description: "Connect Google accounts and manage Google Business Profile post automation."
};

export default function DashboardPage() {
  return <DashboardClient />;
}
