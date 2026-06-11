export async function generatePDF(element: HTMLElement, filename: string): Promise<void> {
  if (!(window as any).html2pdf) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load html2pdf.js'))
      document.head.appendChild(script)
    })
  }

  const opt = {
    margin: [0, 0, 0, 0],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }

  await (window as any).html2pdf().set(opt).from(element).save()
}
