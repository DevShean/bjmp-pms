import StaffDashboardShell from "../components/StaffDashboardShell";

export default function OfficerPage() {
  return (
    <StaffDashboardShell
      role="officer"
      title="Officer Duty Dashboard"
      description="Access inmate records, document behavior logs, and keep frontline operational data aligned with daily custodial activity."
      highlights={[
        { label: "Inmates Monitored", value: "128", note: "Within current officer coverage" },
        { label: "Behavior Logs", value: "18", note: "Filed during the current shift cycle" },
        { label: "Security Flags", value: "05", note: "Need immediate officer attention" },
      ]}
      focusAreas={[
        "Log inmate behavior updates with complete and accurate timestamps.",
        "Monitor flagged inmates and coordinate immediate response if needed.",
        "Keep unit-level inmate records aligned with shift observations.",
      ]}
    />
  );
}
