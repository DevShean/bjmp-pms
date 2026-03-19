import { NextResponse } from "next/server";

type InmateStatus = "Active" | "Released" | "Transferred";

type StatusCount = {
  status: InmateStatus;
  count: number;
};

const statusCounts: StatusCount[] = [
  { status: "Active", count: 10 },
  { status: "Released", count: 2 },
  { status: "Transferred", count: 1 },
];

export async function GET() {
  return NextResponse.json({
    statusCounts,
    generatedAt: new Date().toISOString(),
  });
}
