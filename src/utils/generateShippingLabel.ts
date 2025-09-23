import QRCode from 'qrcode';

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

export const generateShippingLabel = async (data: LabelData) => {
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

  try {
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(data.sampleId, {
      width: 120,
      height: 120,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Load QR code as image
    const qrImage = new Image();
    qrImage.onload = () => {
      // Center the QR code horizontally
      const qrX = (canvas.width - 120) / 2;
      ctx.drawImage(qrImage, qrX, 210, 120, 120);

      // Add QR code label
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText('Scan QR Code', 200, 345);

      // Footer
      ctx.font = '10px Arial';
      ctx.fillStyle = 'gray';
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
    qrImage.src = qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
};

// Generate a unique sample ID
export const generateSampleId = (userId: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SMPL-${userId.substring(0, 6).toUpperCase()}-${timestamp}-${random}`;
};