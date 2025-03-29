import { format, parse } from 'date-fns';

export interface Transaction {
  accountNumber?: string;
  amount: number;
  merchantName: string;
  timestamp: number;
  transactionMode: string;
  upiId?: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
    Tesseract: any;
  }
}

// Render PDF page to canvas for OCR processing
async function renderPageToCanvas(page: any, scale = 2.0): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return canvas;
}

// Perform OCR on image using Tesseract.js
async function performOCR(imageDataUrl: string): Promise<string> {
  if (typeof window === 'undefined' || !window.Tesseract) {
    console.warn('Tesseract not available, skipping OCR');
    return '';
  }

  try {
    console.log('Starting OCR processing...');
    const result = await window.Tesseract.recognize(
      imageDataUrl,
      'eng',
      { 
        logger: (m: any) => console.log(`OCR: ${m.status} ${m.progress ? Math.round(m.progress * 100) + '%' : ''}`)
      }
    );
    console.log('OCR completed');
    return result.data.text;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

// Extract text from PDF
export async function extractTextFromPDF(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction can only be performed on the client side');
  }

  if (!window.pdfjsLib) {
    throw new Error('PDF.js library not loaded');
  }

  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    console.log(`PDF loaded. Pages: ${pdf.numPages}`);
    
    // First try standard text extraction
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    const standardTextLength = fullText.trim().length;
    console.log(`Standard extraction: ${standardTextLength} characters`);

    // Try OCR if standard extraction yields little text
    if (standardTextLength < 200 && window.Tesseract) {
      console.log('Insufficient text, trying OCR...');
      
      let ocrText = '';
      
      // Process only first 2 pages to save time
      const pagesToProcess = Math.min(pdf.numPages, 2);
      
      for (let i = 1; i <= pagesToProcess; i++) {
        console.log(`OCR processing page ${i}/${pagesToProcess}`);
        const page = await pdf.getPage(i);
        const canvas = await renderPageToCanvas(page);
        const imageDataUrl = canvas.toDataURL('image/png');
        const pageText = await performOCR(imageDataUrl);
        ocrText += pageText + '\n';
        canvas.remove();
      }
      
      const ocrTextLength = ocrText.trim().length;
      
      // Use OCR results if they contain more text
      if (ocrTextLength > standardTextLength) {
        console.log(`Using OCR results (${ocrTextLength} chars)`);
        return ocrText;
      }
      
      // Otherwise, combine both results
      if (ocrTextLength > 0) {
        console.log('Combining standard and OCR results');
        return fullText + '\n' + ocrText;
      }
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

// Extract transactions from text
export function extractTransactions(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Preprocess text to clean up OCR artifacts and normalize spacing
  text = text.replace(/\s+/g, ' ');
  
  // Log the first 500 characters of text for debugging
  console.log('Text sample for extraction:', text.substring(0, 500));
  
  // Multiple patterns to match different transaction formats
  const patterns = [
    // Kotak Bank specific pattern with date, description and amount
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+([A-Za-z0-9\s\.,\-_:@\/\\&\(\)]+?)\s+(?:INR|Rs\.?|₹)?\s*(\d+(?:[,.]\d+)*\.?\d*)/i,
    
    // UPI transaction pattern - more flexible
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(?:UPI[\-\s])?([^\d]+?)(?:UPI[\-\s])?\s+(?:INR|Rs\.?|₹)?\s*(\d+(?:[,.]\d+)*\.?\d*)/i,
    
    // Card/POS transaction pattern - more flexible
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(?:POS|ATM|CARD)\s+([^\d]+?)\s+(?:INR|Rs\.?|₹)?\s*(\d+(?:[,.]\d+)*\.?\d*)/i,
    
    // NEFT/IMPS/RTGS pattern - more flexible
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(?:NEFT|IMPS|RTGS)\s+([^\d]+?)\s+(?:INR|Rs\.?|₹)?\s*(\d+(?:[,.]\d+)*\.?\d*)/i,
    
    // Amount with CR/DR indicator - more flexible
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+([^\d]+?)\s+(?:INR|Rs\.?|₹)?\s*(\d+(?:[,.]\d+)*\.?\d*)\s*(?:CR|DR|Cr|Dr)/i,
    
    // General format for bank statements - more flexible
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+([A-Za-z0-9\s\.,\-_:@\/\\&\(\)]+?)\s+(?:INR|Rs\.?|₹)?\s*(\d+(?:[,.]\d+)*\.?\d*)/i,
    
    // Pattern for tabular data with date at beginning
    /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\s+([A-Za-z0-9\s\.@,\-_:\/\\&\(\)]+)\s+([0-9,.]+)/i,
    
    // Pattern for statements with date and amount at beginning and end
    /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\s+([A-Za-z0-9\s\.@,\-_:\/\\&\(\)]+)\s+([0-9,.]+)(?:\s+(?:CR|DR|Cr|Dr))?/i
  ];

  // Process each line of text
  const lines = text.split('\n');
  
  console.log(`Processing ${lines.length} lines for transactions`);
  
  // Process chunks of text (some statements might span multiple lines)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try to combine with next line if it looks like it might be part of the same transaction
    let combinedLine = line;
    if (i < lines.length - 1 && !lines[i+1].match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
      combinedLine += ' ' + lines[i+1].trim();
    }

    // Try each pattern until match
    for (const pattern of patterns) {
      const match = combinedLine.match(pattern);
      if (match) {
        try {
          let [_, dateStr, description, amountStr] = match;
          
          console.log(`Found potential transaction: Date=${dateStr}, Description=${description}, Amount=${amountStr}`);
          
          // Clean date string and normalize format
          dateStr = dateStr.replace(/[/-]/g, '/');
          
          // Try multiple date formats
          let timestamp: number;
          try {
            // DD/MM/YYYY format
            timestamp = parse(dateStr, 'dd/MM/yyyy', new Date()).getTime();
          } catch {
            try {
              // DD/MM/YY format
              timestamp = parse(dateStr, 'dd/MM/yy', new Date()).getTime();
            } catch {
              try {
                // MM/DD/YYYY format
                timestamp = parse(dateStr, 'MM/dd/yyyy', new Date()).getTime();
              } catch {
                console.warn(`Failed to parse date: ${dateStr}`);
                continue;
              }
            }
          }

          // Clean amount - handle different formats
          amountStr = amountStr.replace(/[,\s₹Rs.INR]/gi, '');
          let amount = parseFloat(amountStr);
          
          if (isNaN(amount)) {
            console.warn(`Invalid amount: ${amountStr}`);
            continue;
          }

          // Determine if credit or debit
          const isDebit = combinedLine.toLowerCase().includes('dr') || 
                          combinedLine.toLowerCase().includes('debit') || 
                          combinedLine.toLowerCase().includes('withdrawal') || 
                          combinedLine.toLowerCase().includes('paid') || 
                          combinedLine.toLowerCase().includes('purchase') ||
                          combinedLine.toLowerCase().includes('deducted');
                          
          const isCredit = combinedLine.toLowerCase().includes('cr') || 
                           combinedLine.toLowerCase().includes('credit') || 
                           combinedLine.toLowerCase().includes('received') || 
                           combinedLine.toLowerCase().includes('refund') ||
                           combinedLine.toLowerCase().includes('added');
          
          if (isDebit) {
            amount = -Math.abs(amount);
          } else if (isCredit) {
            amount = Math.abs(amount);
          }

          // Determine transaction mode
          let transactionMode = 'BANK_TRANSFER';
          if (combinedLine.toLowerCase().includes('upi')) {
            transactionMode = 'UPI';
          } else if (combinedLine.toLowerCase().includes('neft')) {
            transactionMode = 'NEFT';
          } else if (combinedLine.toLowerCase().includes('imps')) {
            transactionMode = 'IMPS';
          } else if (combinedLine.toLowerCase().includes('rtgs')) {
            transactionMode = 'RTGS';
          } else if (combinedLine.toLowerCase().includes('atm')) {
            transactionMode = 'ATM';
          } else if (combinedLine.toLowerCase().includes('pos') || combinedLine.toLowerCase().includes('card')) {
            transactionMode = 'POS';
          } else if (combinedLine.toLowerCase().includes('cash')) {
            transactionMode = 'CASH';
          } else if (combinedLine.toLowerCase().includes('cheque') || combinedLine.toLowerCase().includes('chq')) {
            transactionMode = 'CHEQUE';
          }

          // Extract UPI ID
          const upiMatch = combinedLine.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/i);
          const upiId = upiMatch ? upiMatch[1] : undefined;

          // Extract account number - more patterns
          const accountMatch = combinedLine.match(/A\/c\s*:?\s*(\d+)/i) || 
                               combinedLine.match(/Account\s*:?\s*(\d+)/i) ||
                               combinedLine.match(/Acct\s*:?\s*(\d+)/i) ||
                               combinedLine.match(/AC\s*:?\s*(\d+)/i) ||
                               combinedLine.match(/([0-9]{6,})/); // Look for any 6+ digit number as potential account
          const accountNumber = accountMatch ? accountMatch[1] : undefined;

          // Clean description
          description = description.trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s@.,_\-\/\\&()]/g, '')
            .substring(0, 100);

          console.log(`Processed transaction: ${description}, ${amount}, ${format(timestamp, 'dd/MM/yyyy')}`);
          
          transactions.push({
            merchantName: description,
            amount,
            timestamp,
            transactionMode,
            ...(upiId && { upiId }),
            ...(accountNumber && { accountNumber })
          });

          break;
        } catch (error) {
          console.error('Error processing transaction:', error);
          continue;
        }
      }
    }
  }

  console.log(`Found ${transactions.length} transactions`);
  
  // Sort by date
  return transactions.sort((a, b) => a.timestamp - b.timestamp);
}