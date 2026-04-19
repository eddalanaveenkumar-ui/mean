import * as pdfjsLib from 'pdfjs-dist/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import mammoth from 'mammoth';

export const extractPdfText = async (file, onProgress) => {
  if (onProgress) onProgress('📄 Loading PDF...');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = '';
  let hasTextContent = false;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) onProgress(`📄 Extracting page ${i}/${totalPages}...`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');

    if (pageText.trim().length > 10) {
      hasTextContent = true;
    }
    fullText += `\n--- Page ${i} ---\n${pageText}\n`;
  }

  if (!hasTextContent && window.Tesseract) {
    if (onProgress) onProgress('🔍 Scanned PDF detected — running OCR...');
    fullText = '';

    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
      if (onProgress) onProgress(`🔍 OCR processing page ${i}/${Math.min(totalPages, 10)}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageDataUrl = canvas.toDataURL('image/png');
      try {
        const result = await window.Tesseract.recognize(imageDataUrl, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              onProgress(`🔍 OCR page ${i}: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        fullText += `\n--- Page ${i} (OCR) ---\n${result.data.text}\n`;
      } catch (ocrErr) {
        fullText += `\n--- Page ${i} ---\n[OCR failed]\n`;
      }

      canvas.remove();
    }
  }

  return fullText.trim();
};

export const extractDocxText = async (file, onProgress) => {
  if (onProgress) onProgress('📝 Extracting DOCX content...');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
};

export const extractImageText = async (file, onProgress) => {
  if (!window.Tesseract) {
    if (onProgress) onProgress('⚠️ OCR not available');
    return '[OCR library not loaded]';
  }

  if (onProgress) onProgress('🖼️ Running OCR on image...');

  try {
    const result = await window.Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(`🖼️ OCR: ${Math.round(m.progress * 100)}%`);
        } else if (m.status === 'loading tesseract core' && onProgress) {
          onProgress('🖼️ Loading OCR engine...');
        } else if (m.status === 'loading language traineddata' && onProgress) {
          onProgress(`🖼️ Downloading language model: ${Math.round((m.progress||0) * 100)}%`);
        }
      }
    });
    return result.data.text.trim();
  } catch (err) {
    return '[Image OCR failed]';
  }
};

export const extractFileContent = async (file, onProgress) => {
  if (!file) return '';
  const ext = file.name.split('.').pop().toLowerCase();
  
  try {
    if (ext === 'pdf') {
      return await extractPdfText(file, onProgress);
    } else if (ext === 'docx') {
      return await extractDocxText(file, onProgress);
    } else if (ext === 'doc') {
      try {
        return await extractDocxText(file, onProgress);
      } catch {
        if (onProgress) onProgress('📝 Reading as plain text...');
        return await file.text();
      }
    } else if (['png', 'jpg', 'jpeg', 'bmp', 'webp', 'tiff', 'tif'].includes(ext)) {
      return await extractImageText(file, onProgress);
    } else {
      if (onProgress) onProgress('📝 Reading text file...');
      return await file.text();
    }
  } catch (err) {
    if (onProgress) onProgress('❌ Extraction failed, reading plain text...');
    try {
      return await file.text();
    } catch {
      return '[Failed to extract]';
    }
  }
};
