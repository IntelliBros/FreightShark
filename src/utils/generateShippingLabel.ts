import JsBarcode from 'jsbarcode';

interface LabelData {
  userId: string;
  userName: string;
  productName: string;
  sampleId: string;
  warehouseAddress: {
    warehouse: string;
    street: string;
    city: string;
    province: string;
    postal: string;
    country: string;
  };
}

export const generateShippingLabel = (data: LabelData) => {
  // Create a canvas element for the label
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 350;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = 'black';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE LABEL', 200, 40);

  // Draw border
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 380, 330);

  // Sample Information
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('SAMPLE INFORMATION', 30, 80);

  ctx.font = '14px Arial';
  ctx.fillText(`Product: ${data.productName}`, 30, 110);
  ctx.fillText(`Sample ID: ${data.sampleId}`, 30, 135);
  ctx.fillText(`User ID: ${data.userId}`, 30, 160);
  ctx.fillText(`User Name: ${data.userName}`, 30, 185);

  // Create barcode canvas with better sizing
  const barcodeCanvas = document.createElement('canvas');
  JsBarcode(barcodeCanvas, data.sampleId, {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 14,
    margin: 10,
    textMargin: 5
  });

  // Center the barcode horizontally
  const barcodeX = (canvas.width - barcodeCanvas.width) / 2;
  ctx.drawImage(barcodeCanvas, barcodeX, 210);

  // Footer
  ctx.font = '10px Arial';
  ctx.fillStyle = 'gray';
  ctx.textAlign = 'center';
  ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 200, 325);

  // Convert canvas to blob and download
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipping-label-${data.sampleId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });
};

// Generate a unique sample ID
export const generateSampleId = (userId: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SMPL-${userId.substring(0, 6).toUpperCase()}-${timestamp}-${random}`;
};