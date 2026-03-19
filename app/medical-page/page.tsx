import StaffDashboardShell from "../components/StaffDashboardShell";

export default function MedicalPage() {
  return (
    <StaffDashboardShell
      role="medical"
      title="Medical Operations Desk"
      description="Track inmate health records, treatment schedules, incident notes, and daily medical reporting from one secure clinical dashboard."
      highlights={[
        { label: "Open Cases", value: "11", note: "Currently under medical observation" },
        { label: "Scheduled Checkups", value: "07", note: "Due within the next 24 hours" },
        { label: "Incident Reports", value: "03", note: "Require follow-up documentation" },
      ]}
      focusAreas={[
        "Review inmate consultations and ensure treatment plans are current.",
        "Log incident-related medical observations with complete supporting records.",
        "Prepare timely health reports for command and partner units.",
      ]}
    />
  );
}
