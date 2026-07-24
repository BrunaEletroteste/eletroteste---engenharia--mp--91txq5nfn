import React from 'react'
import { Cpu } from 'lucide-react'
import logoImg from '@/assets/logotransparente-c06b6.png'
import { PageBlock } from './PDFHeaderFooter'
import { renderLaudoTitle } from './PDFFormatters'

export const PDFCoverPage = ({ report, cliente }: { report: any; cliente: any }) => {
  return (
    <PageBlock isFirst report={report}>
      <div className="flex-1 flex flex-col justify-center items-center relative py-20 w-full px-4">
        {/* Border accents */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-blue-900 z-40"></div>
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-amber-500 z-40"></div>

        <div className="flex flex-col items-center justify-center w-full max-w-2xl text-center space-y-12 z-20 relative text-[16px]">
          <div className="flex flex-col items-center justify-center w-full mb-6">
            <img
              src={logoImg}
              alt="Eletroteste Logo"
              className="max-h-24 w-auto object-contain block mb-1.5"
              crossOrigin="anonymous"
            />
            <span className="text-[14px] font-bold text-black leading-none">- Desde 1990 -</span>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 px-4 w-full">
            <Cpu className="w-10 h-10 text-blue-900 stroke-[1.5]" />
            <h1 className="text-[18px] font-bold text-slate-900 uppercase leading-snug tracking-tight text-center space-y-1">
              {renderLaudoTitle(report.tipo_laudo)}
            </h1>
          </div>

          <div className="w-32 h-1.5 bg-blue-900 my-8 rounded-full"></div>

          <div className="w-full text-center space-y-6 mt-10">
            <div>
              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest mb-2 leading-none">
                Cliente
              </p>
              <p className="text-[14px] font-semibold text-slate-800 leading-none">
                {cliente.nome_empresa || 'N/A'}
              </p>
            </div>
            {report.obra && (
              <div>
                <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest mb-2 leading-none">
                  Obra
                </p>
                <p className="text-[14px] font-semibold text-slate-800 leading-none">
                  {report.obra}
                </p>
              </div>
            )}
            <div>
              <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest mb-2 leading-none">
                Relatório Nº
              </p>
              <p className="text-[14px] font-normal text-black leading-none">
                {report.numero_relatorio}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageBlock>
  )
}
