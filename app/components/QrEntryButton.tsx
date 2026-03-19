"use client";

import Swal from "sweetalert2";

type QrEntryButtonProps = {
  visitorName: string;
  profileId: string;
  pdlId?: string;
  disabled?: boolean;
};

export default function QrEntryButton({
  visitorName,
  profileId,
  pdlId,
  disabled = false,
}: QrEntryButtonProps) {
  const encodedPayload = encodeURIComponent(
    JSON.stringify({
      type: "ENTRY_QR",
      visitorName,
      profileId,
      pdlId: pdlId ?? null,
      issuedAt: new Date().toISOString(),
    })
  );

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodedPayload}`;

  const openQrModal = async () => {
    await Swal.fire({
      title: "QR for Entry",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
          <img src="${qrSrc}" alt="Entry QR code" width="220" height="220" style="border-radius:12px;border:1px solid #e2e8f0;" />
          <p style="margin:0;color:#475569;font-size:13px;">Show this QR at the entry gate for verification.</p>
          <p style="margin:0;color:#1e3a8a;font-size:12px;font-weight:600;">Profile: ${profileId}${pdlId ? ` • PDL: ${pdlId}` : ""}</p>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#1e4b8f",
      width: 420,
    });
  };

  return (
    <button
      type="button"
      onClick={openQrModal}
      disabled={disabled}
      className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-all enabled:cursor-pointer hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      QR for Entry
    </button>
  );
}
