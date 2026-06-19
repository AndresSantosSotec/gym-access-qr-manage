/**
 * Descarga un Blob con nombre de archivo explícito (evita nombres tipo UUID sin extensión).
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const safeName = filename.includes('.') ? filename : `${filename}.bin`;
  const typed =
    blob.type && blob.type !== 'application/octet-stream'
      ? blob
      : new Blob([blob], { type: mimeFromFilename(safeName) });

  const url = URL.createObjectURL(typed);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  window.setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 250);
}

export function parseContentDispositionFilename(header?: string | null): string | null {
  if (!header) return null;

  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      /* ignore */
    }
  }

  const ascii = header.match(/filename="?([^";]+)"?/i);
  return ascii?.[1]?.trim() ?? null;
}

export async function parseBlobJsonError(blob: Blob): Promise<string | null> {
  try {
    const text = await blob.text();
    if (!text.trim().startsWith('{')) return null;
    const json = JSON.parse(text) as { message?: string; error?: string };
    return json.message || json.error || null;
  } catch {
    return null;
  }
}

function mimeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'xml') return 'application/xml';
  return 'application/octet-stream';
}
