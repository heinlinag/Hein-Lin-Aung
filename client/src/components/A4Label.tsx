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

    const printWindow = window.open("", "", "height=800,width=600");
    if (!printWindow) return;

    const printContent = printRef.current.innerHTML;
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
            body {
              font-family: Arial, sans-serif;
              background: white;
              padding: 0;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
            .label-container {
              width: 210mm;
              height: 297mm;
              padding: 20mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              gap: 20px;
              page-break-after: always;
            }
            .label-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .label-header h1 {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #1a1a1a;
            }
            .label-header p {
              font-size: 14px;
              color: #666;
            }
            .label-content {
              display: flex;
              gap: 40px;
              align-items: center;
              justify-content: center;
              width: 100%;
            }
            .label-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            .info-row {
              display: flex;
              gap: 10px;
              font-size: 14px;
            }
            .info-label {
              font-weight: bold;
              min-width: 120px;
              color: #333;
            }
            .info-value {
              color: #555;
              flex: 1;
            }
            .qr-code-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
            }
            .qr-code-container canvas {
              border: 2px solid #ddd;
              padding: 10px;
              background: white;
            }
            .qr-label {
              font-size: 12px;
              color: #666;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    // Delay print to allow rendering
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const qrValue = JSON.stringify({
    orderId,
    qty: orderQty,
    masterCard,
    boardSize,
  });

  return (
    <div>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <Printer size={16} />
        Print A4 Label
      </button>

      {/* Hidden print content */}
      <div ref={printRef} style={{ display: "none" }}>
        <div className="label-header">
          <h1>Order Label</h1>
          <p>PP4 Manual Slitter - Stock Management</p>
        </div>

        <div className="label-content">
          <div className="label-info">
            <div className="info-row">
              <span className="info-label">Order ID:</span>
              <span className="info-value">{orderId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Quantity:</span>
              <span className="info-value">{orderQty} pcs</span>
            </div>
            <div className="info-row">
              <span className="info-label">MasterCard:</span>
              <span className="info-value">{masterCard}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Board Size:</span>
              <span className="info-value">{boardSize}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Flute Type:</span>
              <span className="info-value">{fluteType}</span>
            </div>
            <div className="info-row">
              <span className="info-label">BQ Comment:</span>
              <span className="info-value">{bqComment}</span>
            </div>
          </div>

          <div className="qr-code-container">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin={true}
            />
            <span className="qr-label">Scan to view details</span>
          </div>
        </div>
      </div>
    </div>
  );
};
