import React from 'react'
import pb from '@/lib/pocketbase/client'
import { PDFCoverPage } from './PDFCoverPage'
import { PDFGeneralInfo } from './PDFGeneralInfo'
import { PDFEquipmentIndex } from './PDFEquipmentIndex'
import { PDFEquipmentDetails } from './PDFEquipmentDetails'
import { PageBlock, ReportHeader } from './PDFHeaderFooter'

export function ReportPDFTemplate({ report, equipments }: { report: any; equipments: any[] }) {
  const cliente = report.expand?.cliente_id || {}
  const autor = report.expand?.criado_por || {}

  return (
    <div className="pdf-template-container w-[210mm] bg-white text-black font-sans relative pb-8">
      <PDFCoverPage report={report} cliente={cliente} />
      <PDFGeneralInfo report={report} cliente={cliente} autor={autor} />

      {equipments.length > 0 && <PDFEquipmentIndex report={report} equipments={equipments} />}

      {equipments.map((eq, i) => (
        <PDFEquipmentDetails key={eq.id} report={report} eq={eq} globalIndex={eq.ordem || i + 1} />
      ))}

      <PageBlock report={report}>
        <ReportHeader report={report} />
        <div className="mb-4 text-[12px] flex-1">
          <div className="bg-slate-800 text-white p-1.5 font-bold mb-1.5 uppercase text-[13px] tracking-wider">
            ASSINATURA
          </div>
          <div className="mt-20 pt-4 pb-4 flex items-center justify-around px-8 gap-8">
            <div className="w-1/2 text-center text-[12px] flex flex-col items-center">
              <div className="w-full border-t border-black pt-3 font-semibold text-slate-900">
                {report.responsavel_tecnico || autor.name || 'Executor Responsável'}
              </div>
              <div className="text-slate-600 mt-1 font-medium text-[10px]">
                Executor Responsável
              </div>
              <div className="text-slate-500 mt-0.5 font-medium text-[9px]">
                ELETROTESTE MANUTENÇÕES ELÉTRICAS LTDA
              </div>
            </div>
            <div className="w-1/2 text-center text-[12px] flex flex-col items-center">
              <div className="w-full border-t border-black pt-3 font-semibold text-slate-900">
                {report.aprovador_relatorio || 'Aprovador do Relatório'}
              </div>
              <div className="text-slate-600 mt-1 font-medium text-[10px]">
                Aprovador do Relatório
              </div>
              <div className="text-slate-500 mt-0.5 font-medium text-[9px]">
                ELETROTESTE MANUTENÇÕES ELÉTRICAS LTDA
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 text-[12px] mt-8">
          <div className="bg-slate-800 text-white p-1.5 font-bold mb-4 uppercase text-[13px] tracking-wider">
            ANEXOS
          </div>
          <div className="border border-slate-300 rounded p-6 bg-slate-50 flex items-center justify-center text-center">
            <span className="text-slate-700 font-medium">
              Os documentos complementares e certificados correspondentes a este relatório técnico
              encontram-se anexados nas páginas subsequentes.
            </span>
          </div>
        </div>
      </PageBlock>

      {report.anexos &&
        report.anexos.length > 0 &&
        report.anexos.map((anexo: string, i: number) => {
          const isImage = anexo.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
          if (isImage) {
            return (
              <PageBlock key={anexo} report={report}>
                <ReportHeader report={report} />
                <div className="w-full text-center mb-4 text-[14px] font-bold text-slate-800 bg-slate-100 py-2 border border-slate-200">
                  ANEXO {i + 1}
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <img
                    src={pb.files.getURL(report, anexo)}
                    crossOrigin="anonymous"
                    className="max-w-full max-h-[200mm] object-contain"
                  />
                </div>
              </PageBlock>
            )
          }
          return null
        })}
    </div>
  )
}
