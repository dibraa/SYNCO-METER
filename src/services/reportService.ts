import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function printHtmlOnWeb(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      reject(new Error('Browser print context is unavailable.'));
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    };

    try {
      const doc = iframe.contentWindow?.document;
      if (!doc || !iframe.contentWindow) {
        cleanup();
        reject(new Error('Unable to open printable preview frame.'));
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          cleanup();
          resolve();
        } catch (err) {
          cleanup();
          reject(err);
        }
      }, 250);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

/**
 * Opens the system Print / Save-as-PDF dialog for the formatted HTML report.
 * Uses an isolated print iframe on Web so only the report prints (never the app shell).
 */
export async function printEnergyReport(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    await printHtmlOnWeb(html);
    return;
  }

  await Print.printAsync({ html });
}

/**
 * Generates a PDF file and opens the native Share / Save sheet on iOS/Android.
 * On Web, launches the clean printable report dialog (Save as PDF).
 */
export async function shareEnergyReportPdf(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    await printHtmlOnWeb(html);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share or Save SYNCO METER Report',
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

/**
 * Downloads a CSV export on Web or invokes the native Share sheet on mobile.
 */
export async function exportEnergyReportCsv(
  csv: string,
  filename: string = 'synco-meter-report.csv'
): Promise<void> {
  if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof Blob !== 'undefined') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  await Share.share({
    title: 'SYNCO METER CSV Export',
    message: csv,
  });
}
