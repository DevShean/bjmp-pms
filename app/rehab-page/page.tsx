import StaffDashboardShell from "../components/StaffDashboardShell";

export default function RehabPage() {
  return (
    <StaffDashboardShell
      role="rehab"
      title="Rehabilitation Program Hub"
      description="Coordinate intervention programs, review inmate progress, and maintain behavior and reporting workflows for rehabilitation planning."
      highlights={[
        { label: "Active Programs", value: "12", note: "Running across rehabilitation units" },
        { label: "Progress Reviews", value: "21", note: "Pending case assessment updates" },
        { label: "Weekly Reports", value: "04", note: "Queued for supervisor review" },
      ]}
      focusAreas={[
        "Track inmate progress against active rehabilitation plans.",
        "Manage program schedules and participant assignments by unit.",
        "Compile behavior-driven reports for case conferences and review boards.",
      ]}
    />
  );
}
