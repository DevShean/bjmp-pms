import StaffDashboardShell from "../components/StaffDashboardShell";

export default function AdminPage() {
  return (
    <StaffDashboardShell
      role="admin"
      title="Administrator Control Center"
      description="Monitor inmate records, visitation approvals, user permissions, and audit activity from a single operations workspace."
      highlights={[
        { label: "Visitation Requests", value: "14", note: "Awaiting administrative review" },
        { label: "Active Programs", value: "09", note: "Across all rehabilitation units" },
        { label: "System Users", value: "26", note: "Staff accounts with active access" },
      ]}
      focusAreas={[
        "Approve or escalate visitation requests requiring administrative review.",
        "Keep inmate profiles, transfer records, and release statuses synchronized.",
        "Audit staff activity trails for accountability and policy compliance.",
      ]}
    />
  );
}
