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
  canvas.height = 600;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = 'black';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE SHIPPING LABEL', 200, 30);

  // Draw border
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 380, 580);

  // Warehouse Address Section
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('SHIP TO:', 20, 70);

  ctx.font = '12px Arial';
  ctx.fillText(data.warehouseAddress.warehouse, 20, 90);
  ctx.fillText(data.warehouseAddress.street, 20, 110);
  ctx.fillText(`${data.warehouseAddress.city}, ${data.warehouseAddress.province}`, 20, 130);
  ctx.fillText(`${data.warehouseAddress.postal}, ${data.warehouseAddress.country}`, 20, 150);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(20, 170);
  ctx.lineTo(380, 170);
  ctx.stroke();

  // Sample Information
  ctx.font = 'bold 14px Arial';
  ctx.fillText('SAMPLE INFORMATION:', 20, 200);

  ctx.font = '12px Arial';
  ctx.fillText(`Product: ${data.productName}`, 20, 225);
  ctx.fillText(`Sample ID: ${data.sampleId}`, 20, 245);
  ctx.fillText(`User ID: ${data.userId}`, 20, 265);
  ctx.fillText(`User Name: ${data.userName}`, 20, 285);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(20, 305);
  ctx.lineTo(380, 305);
  ctx.stroke();

  // Barcode Section
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN BARCODE', 200, 335);

  // Create barcode canvas
  const barcodeCanvas = document.createElement('canvas');
  JsBarcode(barcodeCanvas, data.sampleId, {
    format: 'CODE128',
    width: 2,
    height: 80,
    displayValue: true,
    fontSize: 12,
    margin: 10
  });

  // Draw barcode on main canvas
  ctx.drawImage(barcodeCanvas, 50, 350);

  // Instructions
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = 'red';
  ctx.textAlign = 'center';
  ctx.fillText('IMPORTANT INSTRUCTIONS:', 200, 470);

  ctx.font = '11px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText('1. Print this label and attach to sample package', 200, 490);
  ctx.fillText('2. Ensure barcode is clearly visible', 200, 510);
  ctx.fillText('3. Do not cover or damage the barcode', 200, 530);
  ctx.fillText('4. Ship to the address shown above', 200, 550);

  // Footer
  ctx.font = '10px Arial';
  ctx.fillStyle = 'gray';
  ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 200, 575);

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