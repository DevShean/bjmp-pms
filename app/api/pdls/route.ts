import { NextResponse } from "next/server";

function avatarDataUrl(name: string, bgColor: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='48' fill='${bgColor}'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI' font-size='34' fill='white' font-weight='700'>${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const pdls = [
  {
    id: "PDL-1001",
    name: "Ramon Dela Cruz",
    imageUrl: avatarDataUrl("Ramon Dela Cruz", "#1e4b8f"),
    unit: "Dorm A",
  },
  {
    id: "PDL-1002",
    name: "Jose Manuel Santos",
    imageUrl: avatarDataUrl("Jose Manuel Santos", "#0f2f6a"),
    unit: "Dorm B",
  },
  {
    id: "PDL-1003",
    name: "Carlo Benitez",
    imageUrl: avatarDataUrl("Carlo Benitez", "#2a5ca5"),
    unit: "Dorm C",
  },
  {
    id: "PDL-1004",
    name: "Mark Anthony Rivera",
    imageUrl: avatarDataUrl("Mark Anthony Rivera", "#15337b"),
    unit: "Dorm D",
  },
  {
    id: "PDL-1005",
    name: "Leo Pagulayan",
    imageUrl: avatarDataUrl("Leo Pagulayan", "#2952b3"),
    unit: "Dorm E",
  },
];

export async function GET() {
  return NextResponse.json(pdls);
}
