import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

interface A4LabelProps {
  orderId: string;
  orderQty: number;
  masterCard: string;
  boardSize: string;
  fluteType: string;
  bqComment: string;
}

export const A4Label: React.FC<A4LabelProps> = ({
  orderId,
  orderQty,
  masterCard,
  boardSize,
  fluteType,
  bqComment,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "", "height=900,width=800");
    if (!printWindow) return;

    const printContent = printRef.current.innerHTML;
    const currentDate = new Date().toLocaleString();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Order Label - ${orderId}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                display: block;
              }
            }
            .label-page {
              width: 210mm;
              height: 297mm;
              padding: 15mm;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              page-break-after: always;
            }
            .label-header {
              text-align: center;
              border-bottom: 3px solid #1a5f7a;
              padding-bottom: 12mm;
              margin-bottom: 12mm;
            }
            .header-top {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10mm;
              margin-bottom: 5mm;
            }
            .header-logo {
              height: 12mm;
              width: 12mm;
              object-fit: contain;
            }
            .header-title {
              font-size: 20px;
              font-weight: bold;
              color: #1a1a1a;
              margin: 0;
            }
            .header-subtitle {
              font-size: 11px;
              color: #666;
              margin: 3mm 0 0 0;
            }
            .label-content {
              display: flex;
              gap: 15mm;
              align-items: flex-start;
              justify-content: space-between;
              flex: 1;
              margin-bottom: 10mm;
            }
            .label-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 8mm;
            }
            .info-section {
              display: flex;
              flex-direction: column;
              gap: 4mm;
            }
            .info-section-title {
              font-size: 13px;
              font-weight: bold;
              color: #1a5f7a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #1a5f7a;
              padding-bottom: 3mm;
            }
            .info-row {
              display: flex;
              gap: 5mm;
              font-size: 14px;
              align-items: flex-start;
            }
            .info-label {
              font-weight: bold;
              min-width: 35mm;
              color: #333;
              text-transform: uppercase;
              font-size: 13px;
            }
            .info-value {
              color: #555;
              flex: 1;
              word-break: break-word;
              font-size: 15px;
              font-weight: 600;
            }
            .qr-section {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 5mm;
              padding: 8mm;
              border: 2px solid #1a5f7a;
              border-radius: 4px;
              background: #f9f9f9;
            }
            .qr-code-container {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code-container svg {
              width: 50mm;
              height: 50mm;
            }
            .qr-label {
              font-size: 9px;
              color: #666;
              font-weight: bold;
              text-align: center;
            }
            .label-footer {
              border-top: 2px solid #1a5f7a;
              padding-top: 8mm;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #999;
            }
            .footer-left {
              display: flex;
              flex-direction: column;
              gap: 2mm;
            }
            .footer-right {
              text-align: right;
              display: flex;
              flex-direction: column;
              gap: 2mm;
            }
            .qty-badge {
              display: inline-block;
              background: #1a5f7a;
              color: white;
              padding: 4mm 8mm;
              border-radius: 3px;
              font-weight: bold;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="label-page">
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
    }, 300);
  };

    const qrValue = JSON.stringify({
      orderId,
      qty: orderQty,
      bq: masterCard,
      boardSize,
      timestamp: new Date().toISOString(),
    });

  const currentDate = new Date();
  const printDate = currentDate.toLocaleDateString();
  const printTime = currentDate.toLocaleTimeString();

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
        <div className="label-header">
          <div className="header-top">
            <img src="/manus-storage/gspp-logo_988a5ce5.png" alt="GSPP" className="header-logo" />
            <div>
              <h1 className="header-title">PP4 Stock Board (NPRM)</h1>
              <p className="header-subtitle">Stock Management System</p>
            </div>
          </div>
        </div>

        <div className="label-content">
          <div className="label-info">
            <div className="info-section">
              <div className="info-section-title">Order Information</div>
              <div className="info-row">
                <span className="info-label">Order ID</span>
                <span className="info-value">{orderId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Quantity</span>
                <span className="info-value"><span className="qty-badge">{orderQty} pcs</span></span>
              </div>
            </div>

            <div className="info-section">
              <div className="info-section-title">Product Details</div>
              <div className="info-row">
                <span className="info-label">Board Size</span>
                <span className="info-value">{boardSize} mm</span>
              </div>
              <div className="info-row">
                <span className="info-label">Flute Type</span>
                <span className="info-value">{fluteType}</span>
              </div>
                              <div className="info-row">
                <span className="info-label">BQ</span>
                <span className="info-value">{masterCard}</span>
              </div>
            </div>

            <div className="info-section">
              <div className="info-section-title">Specifications</div>
              <div className="info-row">
                <span className="info-label">BQ Comment</span>
                <span className="info-value">{bqComment}</span>
              </div>
            </div>
          </div>

          <div className="qr-section">
            <div className="qr-code-container">
              <QRCodeSVG
                value={qrValue}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <span className="qr-label">Scan to verify order details</span>
          </div>
        </div>

        <div className="label-footer">
          <div className="footer-left">
            <div><strong>Printed:</strong> {printDate} {printTime}</div>
            <div><strong>System:</strong> PP4 Stock Management</div>
          </div>
          <div className="footer-right">
            <div>For verification and tracking purposes only</div>
          </div>
        </div>
      </div>
    </div>
  );
};
