import pb from '@/lib/pocketbase/client'

const PDF_LIB_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

const loadedScripts = new Map<string, Promise<void>>()

function loadScript(url: string): Promise<void> {
  if (loadedScripts.has(url)) return loadedScripts.get(url)!
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load: ${url}`))
    document.head.appendChild(script)
  })
  loadedScripts.set(url, promise)
  return promise
}

async function loadPdfLib() {
  await loadScript(PDF_LIB_CDN)
  return (window as any).PDFLib
}

async function loadPdfJs() {
  await loadScript(PDFJS_CDN)
  const pdfjsLib = (window as any).pdfjsLib
  if (pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN
  }
  return pdfjsLib
}

export function isImageFile(filename: string): boolean {
  return /\.(jpe?g|gif|png|webp|svg|bmp)$/i.test(filename)
}

export function isPdfFile(filename: string): boolean {
  return /\.pdf$/i.test(filename)
}

export function getAnexoUrl(record: any, filename: string): string {
  return pb.files.getURL(record, filename)
}

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89

async function addPlaceholderPage(pdfDoc: any, StandardFonts: any, rgb: any, filename: string) {
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const text = `Anexo: ${filename} (formato não suportado para impressão)`
  const fontSize = 14
  const textWidth = font.widthOfTextAtSize(text, fontSize)
  page.drawText(text, {
    x: (page.getWidth() - textWidth) / 2,
    y: page.getHeight() / 2,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
}

async function addImagePage(pdfDoc: any, blob: Blob, filename: string) {
  const arrayBuffer = await blob.arrayBuffer()
  let image
  if (/\.png$/i.test(filename)) {
    image = await pdfDoc.embedPng(arrayBuffer)
  } else {
    image = await pdfDoc.embedJpg(arrayBuffer)
  }
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
  const maxWidth = page.getWidth() - 60
  const maxHeight = page.getHeight() - 60
  const { width, height } = image.scale(1)
  const scale = Math.min(maxWidth / width, maxHeight / height, 1)
  const w = width * scale
  const h = height * scale
  page.drawImage(image, {
    x: (page.getWidth() - w) / 2,
    y: (page.getHeight() - h) / 2,
    width: w,
    height: h,
  })
}

export async function mergeAttachmentsToPdf(
  mainPdfBlob: Blob,
  anexos: string[],
  record: any,
): Promise<Blob> {
  if (!anexos || anexos.length === 0) return mainPdfBlob

  const PDFLib = await loadPdfLib()
  const { PDFDocument, StandardFonts, rgb } = PDFLib
  const mainPdf = await PDFDocument.load(await mainPdfBlob.arrayBuffer())

  for (const anexo of anexos) {
    const url = getAnexoUrl(record, anexo)
    let blob: Blob | null = null
    try {
      const response = await fetch(url)
      if (response.ok) {
        blob = await response.blob()
      }
    } catch {
      // fetch failed
    }

    if (blob && isPdfFile(anexo)) {
      try {
        const attachmentPdf = await PDFDocument.load(await blob.arrayBuffer())
        const pages = await mainPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices())
        pages.forEach((page: any) => mainPdf.addPage(page))
      } catch {
        await addPlaceholderPage(mainPdf, StandardFonts, rgb, anexo)
      }
    } else if (blob && isImageFile(anexo)) {
      try {
        await addImagePage(mainPdf, blob, anexo)
      } catch {
        await addPlaceholderPage(mainPdf, StandardFonts, rgb, anexo)
      }
    } else {
      await addPlaceholderPage(mainPdf, StandardFonts, rgb, anexo)
    }
  }

  const pdfBytes = await mainPdf.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

export async function renderPdfToImages(url: string): Promise<string[]> {
  const pdfjsLib = await loadPdfJs()
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const images: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg', 0.85))
  }

  return images
}
