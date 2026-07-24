import { useState, useEffect, useRef } from 'react'
import { isImageFile, isPdfFile, getAnexoUrl, renderPdfToImages } from '@/lib/pdf-attachments'

interface Props {
  anexos: string[]
  record: any
  onReady?: () => void
}

export function ReportAnexoPages({ anexos, record, onReady }: Props) {
  const [renderedSet, setRenderedSet] = useState<Set<number>>(new Set())
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const onReadyCalled = useRef(false)

  useEffect(() => {
    if (!anexos || anexos.length === 0) {
      onReadyRef.current?.()
      return
    }
    const initiallyRendered = new Set<number>()
    anexos.forEach((anexo, i) => {
      if (!isPdfFile(anexo) && !isImageFile(anexo)) {
        initiallyRendered.add(i)
      }
    })
    setRenderedSet(initiallyRendered)
  }, [anexos])

  useEffect(() => {
    if (anexos.length > 0 && renderedSet.size >= anexos.length && !onReadyCalled.current) {
      onReadyCalled.current = true
      onReadyRef.current?.()
    }
  }, [renderedSet, anexos.length])

  const markRendered = (index: number) => {
    setRenderedSet((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  if (!anexos || anexos.length === 0) return null

  return (
    <>
      {anexos.map((anexo, i) => {
        if (isPdfFile(anexo)) {
          return (
            <PdfAnexoPages
              key={anexo}
              url={getAnexoUrl(record, anexo)}
              filename={anexo}
              onRendered={() => markRendered(i)}
            />
          )
        }
        if (isImageFile(anexo)) {
          return (
            <div
              key={anexo}
              className="print:break-before-page"
              style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
            >
              <div className="w-full h-[297mm] flex items-center justify-center bg-white">
                <img
                  src={getAnexoUrl(record, anexo)}
                  className="max-w-full max-h-[280mm] object-contain"
                  crossOrigin="anonymous"
                  onLoad={() => markRendered(i)}
                  onError={() => markRendered(i)}
                />
              </div>
            </div>
          )
        }
        return (
          <div
            key={anexo}
            className="print:break-before-page"
            style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
          >
            <div className="w-full h-[297mm] flex items-center justify-center bg-white">
              <p className="text-center text-slate-800 text-lg font-medium px-8">
                Anexo: {anexo} (formato não suportado para impressão)
              </p>
            </div>
          </div>
        )
      })}
    </>
  )
}

function PdfAnexoPages({
  url,
  filename,
  onRendered,
}: {
  url: string
  filename: string
  onRendered: () => void
}) {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const onRenderedRef = useRef(onRendered)
  onRenderedRef.current = onRendered

  useEffect(() => {
    let cancelled = false
    renderPdfToImages(url)
      .then((imgs) => {
        if (cancelled) return
        setImages(imgs)
        setLoading(false)
        onRenderedRef.current()
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
        onRenderedRef.current()
      })
    return () => {
      cancelled = true
    }
  }, [url])

  if (loading) {
    return (
      <div
        className="print:break-before-page"
        style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
      >
        <div className="w-full h-[297mm] flex items-center justify-center bg-white">
          <p className="text-slate-400 text-sm">Carregando {filename}...</p>
        </div>
      </div>
    )
  }

  if (error || images.length === 0) {
    return (
      <div
        className="print:break-before-page"
        style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
      >
        <div className="w-full h-[297mm] flex items-center justify-center bg-white">
          <p className="text-center text-slate-800 text-lg font-medium px-8">
            Anexo: {filename} (formato não suportado para impressão)
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {images.map((img, i) => (
        <div
          key={`${filename}-${i}`}
          className="print:break-before-page"
          style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
        >
          <div className="w-full h-[297mm] flex items-center justify-center bg-white">
            <img src={img} className="max-w-full max-h-[280mm] object-contain" />
          </div>
        </div>
      ))}
    </>
  )
}
