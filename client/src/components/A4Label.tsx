import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

interface A4LabelProps {
  orderId: string;
  trackingId?: string;
  orderQty: number;
  masterCard: string;
  boardSize: string;
  fluteType: string;
  bqComment: string;
}

export const A4Label: React.FC<A4LabelProps> = ({
  orderId,
  trackingId,
  orderQty,
  masterCard,
  boardSize,
  fluteType,
  bqComment,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "", "height=1100,width=850");
    if (!printWindow) return;

    const printContent = printRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Order Label - ${orderId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              background: white;
              font-family: 'Segoe UI', Arial, sans-serif;
            }
            @page { size: A4; margin: 0; }
            @media print {
              html, body { width: 210mm; height: 297mm; }
            }

            .page {
              width: 210mm;
              height: 297mm;
              padding: 12mm 14mm;
              display: flex;
              flex-direction: column;
              background: white;
            }

            /* ── HEADER ── */
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 6mm;
              border-bottom: 2px solid #000;
              margin-bottom: 7mm;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 5mm;
            }
            .logo {
              width: 14mm;
              height: 14mm;
              object-fit: contain;
            }
            .brand-name {
              font-size: 22px;
              font-weight: 900;
              color: #000;
              letter-spacing: -0.3px;
              line-height: 1.1;
            }
            .brand-sub {
              font-size: 10px;
              color: #000;
              margin-top: 1mm;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .header-right {
              text-align: right;
            }
            .doc-type {
              font-size: 11px;
              font-weight: 700;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 1px;
              background: white;
              border: 1px solid #000;
              padding: 2mm 5mm;
              border-radius: 2px;
            }
            .print-date {
              font-size: 9px;
              color: #000;
              margin-top: 2mm;
            }

            /* ── ORDER ID BANNER ── */
            .order-banner {
              background: white;
              color: #000;
              border: 2px solid #000;
              padding: 5mm 8mm;
              border-radius: 3px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 7mm;
            }
            .order-id-label {
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 2px;
              text-transform: uppercase;
              opacity: 1;
              color: #000;
            }
            .order-id-value {
              font-size: 30px;
              font-weight: 900;
              letter-spacing: 1px;
              line-height: 1;
              color: #000;
            }
            .qty-pill {
              background: white;
              color: #000;
              border: 1px solid #000;
              font-size: 22px;
              font-weight: 900;
              padding: 3mm 7mm;
              border-radius: 3px;
              text-align: center;
              line-height: 1.1;
            }
            .qty-pill-label {
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.7;
              text-align: center;
              margin-top: 1mm;
            }

            /* ── MAIN BODY ── */
            .body {
              display: flex;
              gap: 8mm;
              flex: 1;
              margin-bottom: 7mm;
            }

            /* ── INFO PANEL ── */
            .info-panel {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 5mm;
            }
            .section {
              border: 1px solid #000;
              border-radius: 3px;
              overflow: hidden;
            }
            .section-header {
              background: white;
              border-bottom: 1px solid #000;
              padding: 2.5mm 5mm;
              font-size: 10px;
              font-weight: 800;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .section-body {
              padding: 4mm 5mm;
              display: flex;
              flex-direction: column;
              gap: 3.5mm;
              background: white;
            }
            .field-row {
              display: flex;
              align-items: flex-start;
              gap: 3mm;
            }
            .field-label {
              font-size: 10px;
              font-weight: 700;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              min-width: 28mm;
              padding-top: 0.5mm;
            }
            .field-value {
              font-size: 16px;
              font-weight: 700;
              color: #000;
              flex: 1;
              word-break: break-word;
              line-height: 1.2;
            }
            .field-value.large {
              font-size: 20px;
              font-weight: 900;
              color: #000;
            }

            /* ── QR PANEL ── */
            .qr-panel {
              width: 62mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4mm;
            }
            .qr-box {
              border: 2px solid #000;
              border-radius: 4px;
              padding: 4mm;
              background: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 3mm;
              width: 100%;
            }
            .qr-box svg {
              width: 52mm !important;
              height: 52mm !important;
            }
            .qr-caption {
              font-size: 8px;
              color: #000;
              text-align: center;
              font-weight: 600;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .qr-order-id {
              font-size: 11px;
              font-weight: 900;
              color: #0f4c75;
              text-align: center;
              letter-spacing: 1px;
            }

            /* ── FOOTER ──             .footer {
              border-top: 1px solid #000;
              padding-top: 5mm;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8px;
              color: #000;
            }px;
              color: #aaa;
              line-height: 1.6;
            }
            .footer-right {
              font-size: 9px;
              color: #aaa;
              text-align: right;
              line-height: 1.6;
            }
            .verified-badge {
              display: inline-block;
              background: #e8f4fd;
              color: #0f4c75;
              font-size: 8px;
              font-weight: 700;
              padding: 1mm 3mm;
              border-radius: 2px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="page">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  const qrValue = JSON.stringify({
    orderId,
    trackingId,
    qty: orderQty,
    bq: masterCard,
    boardSize,
    fluteType,
    timestamp: new Date().toISOString(),
  });

  const now = new Date();
  const printDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const printTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <button
        onClick={handlePrint}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Print A4 Label"
      >
        <Printer size={16} />
      </button>

      {/* Hidden print content */}
      <div ref={printRef} style={{ display: "none" }}>

        {/* HEADER */}
        <div className="header">
          <div className="header-left">
            <img src="/manus-storage/gspp-logo_988a5ce5.png" alt="GSPP" className="logo" />
            <div>
              <div className="brand-name">PP4 Stock Board (NPRM)</div>
              <div className="brand-sub">Stock Management System</div>
            </div>
          </div>
          <div className="header-right">
            <div className="doc-type">Stock Label</div>
            <div className="print-date">Printed: {printDate} {printTime}</div>
          </div>
        </div>

        {/* ORDER ID BANNER */}
        <div className="order-banner">
          <div>
            <div className="order-id-label">Production Order</div>
            <div className="order-id-value">{orderId}</div>
            {trackingId && <div style={{ fontSize: '11px', fontWeight: '600', marginTop: '2mm', letterSpacing: '1px', opacity: 0.9 }}>Ref: {trackingId}</div>}
          </div>
          <div>
            <div className="qty-pill">{orderQty}</div>
            <div className="qty-pill-label">pcs</div>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="body">

          {/* INFO PANEL */}
          <div className="info-panel">

            <div className="section">
              <div className="section-header">Product Details</div>
              <div className="section-body">
                <div className="field-row">
                  <span className="field-label">Board Size</span>
                  <span className="field-value large">{boardSize} mm</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Flute Type</span>
                  <span className="field-value large">{fluteType}</span>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">BQ Information</div>
              <div className="section-body">
                <div className="field-row">
                  <span className="field-label">BQ</span>
                  <span className="field-value">{masterCard}</span>
                </div>
                {bqComment && (
                  <div className="field-row">
                    <span className="field-label">BQ Comment</span>
                    <span className="field-value">{bqComment}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* QR PANEL */}
          <div className="qr-panel">
            <div className="qr-box">
              <QRCodeSVG
                value={qrValue}
                size={210}
                level="H"
                includeMargin={false}
              />
              <div className="qr-order-id">{orderId}</div>
              <div className="qr-caption">Scan to verify</div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-left">
            <div>PP4 Manual Slitter · Stock Management System</div>
            <div>Generated: {printDate} at {printTime}</div>
          </div>
          <div className="footer-right">
            <span className="verified-badge">For Verification Only</span>
            <div style={{ marginTop: "1mm" }}>Do not duplicate or alter this label</div>
          </div>
        </div>

      </div>
    </div>
  );
};
