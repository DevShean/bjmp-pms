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
      className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200/50 bg-blue-50/80 px-4 py-2 md:py-3 text-[11px] md:text-sm font-medium text-blue-700 transition-all enabled:cursor-pointer hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
      QR for Entry
    </button>
  );
}
