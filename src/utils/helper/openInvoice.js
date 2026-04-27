/**
 * Opens a PDF invoice in a new browser tab with "Invoice" as the tab title.
 * @param {string} pdfUrl - The URL of the PDF to display.
 */
export const openInvoice = (pdfUrl) => {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<html><head><title>Invoice</title></head><body style="margin:0"><iframe src="${pdfUrl}" style="width:100%;height:100%;border:none"></iframe></body></html>`
  );
  w.document.close();
};
