import React, { useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import JsBarcode from "jsbarcode";

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
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && trackingId) {
      try {
        JsBarcode(barcodeRef.current, trackingId, {
          format: "CODE128",
          width: 2.2,
          height: 70,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [trackingId]);

  const now = new Date();
  const printDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const printTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "", "height=1200,width=900");
    if (!printWindow) return;

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Stock Label — ${orderId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              width: 210mm;
              height: 297mm;
              background: #fff;
              font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page { size: A4 portrait; margin: 0; }

            .page {
              width: 210mm;
              height: 297mm;
              padding: 10mm 12mm;
              display: flex;
              flex-direction: column;
              background: #fff;
              position: relative;
            }

            /* ── CORNER MARKS ── */
            .corner { position: absolute; width: 6mm; height: 6mm; }
            .corner-tl { top: 5mm; left: 5mm; border-top: 0.5mm solid #000; border-left: 0.5mm solid #000; }
            .corner-tr { top: 5mm; right: 5mm; border-top: 0.5mm solid #000; border-right: 0.5mm solid #000; }
            .corner-bl { bottom: 5mm; left: 5mm; border-bottom: 0.5mm solid #000; border-left: 0.5mm solid #000; }
            .corner-br { bottom: 5mm; right: 5mm; border-bottom: 0.5mm solid #000; border-right: 0.5mm solid #000; }

            /* ── HEADER ── */
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 5mm;
              border-bottom: 0.8mm solid #000;
              margin-bottom: 6mm;
            }
            .header-left { display: flex; align-items: center; gap: 4mm; }
            .logo { width: 13mm; height: 13mm; object-fit: contain; }
            .brand-name {
              font-size: 20px;
              font-weight: 900;
              color: #000;
              letter-spacing: -0.5px;
              line-height: 1;
            }
            .brand-sub {
              font-size: 8.5px;
              color: #444;
              margin-top: 1mm;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              font-weight: 500;
            }
            .header-right { text-align: right; }
            .doc-badge {
              display: inline-block;
              background: #000;
              color: #fff;
              font-size: 9px;
              font-weight: 800;
              padding: 1.5mm 5mm;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .print-date {
              font-size: 8px;
              color: #555;
              margin-top: 2mm;
              letter-spacing: 0.3px;
            }

            /* ── ORDER BANNER ── */
            .order-banner {
              border: 0.8mm solid #000;
              display: grid;
              grid-template-columns: 1fr auto;
              align-items: stretch;
              margin-bottom: 6mm;
              overflow: hidden;
            }
            .banner-main {
              padding: 4mm 6mm;
              border-right: 0.8mm solid #000;
            }
            .banner-label {
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 2.5px;
              text-transform: uppercase;
              color: #555;
              margin-bottom: 1.5mm;
            }
            .banner-order-id {
              font-size: 36px;
              font-weight: 900;
              color: #000;
              letter-spacing: -0.5px;
              line-height: 1;
            }
            .banner-tracking {
              font-size: 10px;
              font-weight: 600;
              color: #333;
              margin-top: 2mm;
              letter-spacing: 0.5px;
            }
            .banner-qty {
              padding: 4mm 8mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #000;
              min-width: 30mm;
            }
            .qty-number {
              font-size: 32px;
              font-weight: 900;
              color: #fff;
              line-height: 1;
            }
            .qty-unit {
              font-size: 9px;
              font-weight: 700;
              color: #ccc;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-top: 1mm;
            }

            /* ── MAIN BODY ── */
            .body {
              display: flex;
              gap: 6mm;
              flex: 1;
              margin-bottom: 6mm;
            }

            /* ── INFO PANEL ── */
            .info-panel {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 5mm;
            }

            .section {
              border: 0.5mm solid #000;
              overflow: hidden;
            }
            .section-header {
              background: #000;
              padding: 2mm 5mm;
              font-size: 8.5px;
              font-weight: 800;
              color: #fff;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .section-body {
              padding: 4mm 5mm;
              display: flex;
              flex-direction: column;
              gap: 3.5mm;
              background: #fff;
            }
            .field-row {
              display: flex;
              align-items: baseline;
              gap: 3mm;
            }
            .field-label {
              font-size: 8px;
              font-weight: 700;
              color: #555;
              text-transform: uppercase;
              letter-spacing: 1px;
              min-width: 26mm;
              flex-shrink: 0;
            }
            .field-colon {
              font-size: 10px;
              color: #999;
              flex-shrink: 0;
            }
            .field-value {
              font-size: 18px;
              font-weight: 800;
              color: #000;
              flex: 1;
              word-break: break-word;
              line-height: 1.1;
            }
            .field-value.xl {
              font-size: 24px;
              font-weight: 900;
            }
            .field-value.mono {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 0.5px;
              word-break: break-all;
              line-height: 1.4;
            }

            /* ── DIVIDER LINE ── */
            .divider {
              height: 0.3mm;
              background: #ddd;
              margin: 1mm 0;
            }

            /* ── QR PANEL ── */
            .qr-panel {
              width: 58mm;
              display: flex;
              flex-direction: column;
              gap: 4mm;
            }
            .qr-box {
              border: 0.5mm solid #000;
              padding: 4mm;
              background: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2.5mm;
            }
            .qr-box svg {
              width: 48mm !important;
              height: 48mm !important;
            }
            .qr-label {
              font-size: 7px;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #555;
            }
            .qr-id {
              font-size: 10px;
              font-weight: 800;
              color: #000;
              letter-spacing: 0.5px;
              text-align: center;
              font-family: 'Courier New', monospace;
            }
            .barcode-box {
              border: 0.5mm solid #000;
              padding: 4mm 3mm;
              background: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2mm;
            }
            .barcode-box svg {
              width: 50mm !important;
              height: auto;
            }
            .barcode-id {
              font-size: 8px;
              font-weight: 700;
              color: #000;
              letter-spacing: 1px;
              font-family: 'Courier New', monospace;
              text-align: center;
            }

            /* ── FOOTER ── */
            .footer {
              border-top: 0.5mm solid #000;
              padding-top: 4mm;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .footer-left {
              font-size: 7.5px;
              color: #555;
              line-height: 1.7;
            }
            .footer-right {
              text-align: right;
            }
            .verified-badge {
              display: inline-block;
              border: 0.4mm solid #000;
              color: #000;
              font-size: 7px;
              font-weight: 800;
              padding: 1mm 3mm;
              letter-spacing: 1.5px;
              text-transform: uppercase;
            }
            .footer-note {
              font-size: 7px;
              color: #777;
              margin-top: 1mm;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>
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
    }, 400);
  };

  const qrValue = trackingId || orderId;

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
            <img src="/manus-storage/gspp_logo_new_2db75f16.png" alt="GSPP" className="logo" />
            <div>
              <div className="brand-name">PP4 Manual Slitter</div>
              <div className="brand-sub">Stock Management System</div>
            </div>
          </div>
          <div className="header-right">
            <div className="doc-badge">Stock Label</div>
            <div className="print-date">Printed: {printDate} &nbsp;{printTime}</div>
          </div>
        </div>

        {/* ORDER BANNER */}
        <div className="order-banner">
          <div className="banner-main">
            <div className="banner-label">Production Order</div>
            <div className="banner-order-id">{orderId}</div>
            {trackingId && (
              <div className="banner-tracking">Ref: {trackingId}</div>
            )}
          </div>
          <div className="banner-qty">
            <div className="qty-number">{orderQty}</div>
            <div className="qty-unit">pcs</div>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="body">

          {/* INFO PANEL */}
          <div className="info-panel">

            {/* Product Details */}
            <div className="section">
              <div className="section-header">Product Details</div>
              <div className="section-body">
                <div className="field-row">
                  <span className="field-label">Board Size</span>
                  <span className="field-colon">:</span>
                  <span className="field-value xl">{boardSize} <span style={{ fontSize: '14px', fontWeight: 600 }}>mm</span></span>
                </div>
                <div className="divider"></div>
                <div className="field-row">
                  <span className="field-label">Flute Type</span>
                  <span className="field-colon">:</span>
                  <span className="field-value xl">{fluteType}</span>
                </div>
              </div>
            </div>

            {/* BQ Information */}
            <div className="section">
              <div className="section-header">BQ Information</div>
              <div className="section-body">
                <div className="field-row">
                  <span className="field-label">Master Card</span>
                  <span className="field-colon">:</span>
                  <span className="field-value">{masterCard}</span>
                </div>
                {bqComment && (
                  <>
                    <div className="divider"></div>
                    <div className="field-row">
                      <span className="field-label">BQ Formula</span>
                      <span className="field-colon">:</span>
                      <span className="field-value mono">{bqComment}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Order Qty Summary */}
            <div className="section">
              <div className="section-header">Order Summary</div>
              <div className="section-body">
                <div className="field-row">
                  <span className="field-label">Order Qty</span>
                  <span className="field-colon">:</span>
                  <span className="field-value xl">{orderQty} <span style={{ fontSize: '14px', fontWeight: 600 }}>pcs</span></span>
                </div>
              </div>
            </div>

          </div>

          {/* QR + BARCODE PANEL */}
          <div className="qr-panel">
            {trackingId ? (
              <>
                <div className="qr-box">
                  <div className="qr-label">Tracking QR</div>
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                  <div className="qr-id">{trackingId}</div>
                </div>
                <div className="barcode-box">
                  <div className="qr-label">Barcode</div>
                  <svg ref={barcodeRef}></svg>
                  <div className="barcode-id">{trackingId}</div>
                </div>
              </>
            ) : (
              <div className="qr-box" style={{ justifyContent: "center", minHeight: "100mm", gap: "4mm" }}>
                <div className="qr-label" style={{ fontSize: "16px" }}>N/A</div>
                <div className="qr-label">No Tracking ID</div>
              </div>
            )}
          </div>

        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-left">
            <div><strong>PP4 Manual Slitter</strong> · Stock Management System</div>
            <div>Generated: {printDate} at {printTime}</div>
          </div>
          <div className="footer-right">
            <span className="verified-badge">For Verification Only</span>
            <div className="footer-note">Do not duplicate or alter this label</div>
          </div>
        </div>

      </div>
    </div>
  );
};
