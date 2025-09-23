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
  canvas.height = 390;

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
  ctx.strokeRect(10, 10, 380, 370);

  // Sample Information
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('SAMPLE INFORMATION', 30, 70);

  ctx.font = '12px Arial';
  ctx.fillText(`Product: ${data.productName}`, 30, 90);
  ctx.fillText(`Sample ID: ${data.sampleId}`, 30, 110);
  ctx.fillText(`User ID: ${data.userId}`, 30, 130);
  ctx.fillText(`User Name: ${data.userName}`, 30, 150);

  // Ship To Address
  ctx.font = 'bold 14px Arial';
  ctx.fillText('SHIP TO:', 30, 180);

  ctx.font = '12px Arial';
  // Split address into lines if it's too long
  const addressText = data.warehouseAddress.street || 'No address specified';
  const words = addressText.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
    if (ctx.measureText(currentLine + ' ' + word).width < 340) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);

  // Draw address lines
  lines.forEach((line, index) => {
    ctx.fillText(line, 30, 200 + (index * 15));
  });

  // Generate label with or without QR code
  const generateLabel = async (includeQR: boolean = true) => {
    if (includeQR) {
      try {
        // Create a temporary canvas for QR code
        const qrCanvas = document.createElement('canvas');
        qrCanvas.style.display = 'none';
        document.body.appendChild(qrCanvas);

        // Generate QR code directly to canvas
        await QRCode.toCanvas(qrCanvas, data.sampleId, {
          width: 150,
          height: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Draw QR code on main canvas (bigger and centered)
        const qrSize = 140;
        const qrX = (canvas.width - qrSize) / 2;
        ctx.drawImage(qrCanvas, qrX, 230, qrSize, qrSize);

        // Remove temporary QR canvas
        document.body.removeChild(qrCanvas);
      } catch (qrError) {
        console.error('QR generation failed, generating without QR:', qrError);
        // Continue without QR code
      }
    }

    // Footer (always add)
    ctx.font = '10px Arial';
    ctx.fillStyle = 'gray';
    ctx.textAlign = 'center';
    ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 200, 375);

    // Add manual sample ID text if no QR
    if (!includeQR) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText(data.sampleId, 200, 250);
      ctx.font = '12px Arial';
      ctx.fillText('(Manual Entry Code)', 200, 270);
    }

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

  // Try with QR first, fall back to without
  try {
    await generateLabel(true);
  } catch (error) {
    console.error('Error generating label with QR:', error);
    // Try without QR code
    await generateLabel(false);
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