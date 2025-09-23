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

  // Temporarily add to DOM to ensure it's accessible
  canvas.style.display = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    console.error('Failed to get canvas context');
    return;
  }

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
        // Remove canvas from DOM
        if (canvas.parentNode) {
          document.body.removeChild(canvas);
        }
      });
    };
    qrImage.src = qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Remove canvas from DOM on error
    if (canvas.parentNode) {
      document.body.removeChild(canvas);
    }
    // Try to generate without QR code as fallback
    generateFallbackLabel(data);
  }
};

// Fallback function to generate label without QR code
const generateFallbackLabel = (data: LabelData) => {
  const content = `
SAMPLE SHIPPING LABEL
=====================
Product: ${data.productName}
Sample ID: ${data.sampleId}
User ID: ${data.userId}
User Name: ${data.userName}

SHIP TO:
${data.warehouseAddress.street}

Generated: ${new Date().toLocaleDateString()}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shipping-label-${data.sampleId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper to get next sample sequence number
const getNextSampleSequence = (): number => {
  // Get current sequence from localStorage
  const currentSeq = parseInt(localStorage.getItem('sampleSequence') || '0', 10);
  const nextSeq = currentSeq + 1;
  localStorage.setItem('sampleSequence', nextSeq.toString());
  return nextSeq;
};

// Generate a unique sample ID with format: SMPL[xxxx]-USER[display_id]
export const generateSampleId = (userId: string, displayId: number): string => {
  // Get the sequence number and pad to 4 digits
  const sequence = getNextSampleSequence();
  const paddedSequence = sequence.toString().padStart(4, '0');

  // Always use display_id
  const userIdentifier = displayId.toString();

  return `SMPL${paddedSequence}-USER${userIdentifier}`;
};