import React from 'react'
import logoImg from '@/assets/logotransparente-c06b6.png'
import { renderLaudoTitle } from './PDFFormatters'

export const ReportHeader = ({ report }: { report: any }) => (
  <div className="border-t-[6px] border-blue-900 pb-2 mb-6 w-full">
    <table className="w-full border-collapse border border-slate-800 mt-2 bg-white">
      <tbody>
        <tr>
          <td className="border border-slate-800 w-[25%] p-3 align-middle text-center">
            <div className="flex flex-col items-center justify-center h-full min-h-[4rem]">
              <img
                src={logoImg}
                alt="Eletroteste Logo"
                className="max-h-12 w-auto object-contain block mb-0.5"
                crossOrigin="anonymous"
              />
              <span className="text-[10px] font-bold text-black leading-none">- Desde 1990 -</span>
            </div>
          </td>
          <td className="border border-slate-800 w-[50%] p-3 text-center align-middle">
            <div className="font-semibold text-[12px] text-slate-900 uppercase tracking-tight leading-snug">
              {renderLaudoTitle(report.tipo_laudo)}
            </div>
            <div className="text-[10px] text-slate-600 mt-1.5 font-medium">
              Normas de Referência: NBR 14039 / NBR 5410
            </div>
          </td>
          <td className="border border-slate-800 w-[25%] p-3 align-middle text-slate-800 text-center bg-slate-50">
            <strong className="text-slate-500 block text-[12px] uppercase tracking-widest mb-1 font-medium">
              Relatório Nº
            </strong>
            <span className="text-[14px] text-black font-normal leading-none">
              {report.numero_relatorio}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

export const ReportFooter = ({ report }: { report: any }) => (
  <div className="mt-8 border-t-2 border-slate-800 pt-3 pb-4 text-[10px] text-slate-600 bg-white leading-relaxed w-full z-20">
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center shrink-0">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://mp-eletroteste.goskip.app/validar/' + report.id)}`}
            alt="QR"
            className="w-12 h-12"
            crossOrigin="anonymous"
          />
          <span className="text-[6px] text-slate-600 mt-0.5 font-bold uppercase tracking-wider text-center leading-none">
            Autenticidade
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-left">
          <span>
            <strong className="font-semibold">CNPJ:</strong> 64.941.818/0001-91 &nbsp;|&nbsp;{' '}
            <strong className="font-semibold">IE:</strong> 748.001.165.111 &nbsp;|&nbsp;{' '}
            <strong className="font-semibold">IM:</strong> 688
          </span>
          <span>Rua Andradina, 262 - Remanso Campineiro - Hortolândia - SP</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 text-right">
        <span>
          <strong className="font-semibold">Tels:</strong> (19) 3865-2942 / 3865-1261 &nbsp;|&nbsp;{' '}
          <strong className="font-semibold">WhatsApp:</strong> (19) 9 7143-3853
        </span>
        <span>
          <strong className="font-semibold">Site:</strong> www.eletroteste.com &nbsp;|&nbsp;{' '}
          <strong className="font-semibold">E-mail:</strong> eletroteste@eletroteste.com
        </span>
      </div>
    </div>
  </div>
)

export const PageBlock = ({
  children,
  isFirst,
  report,
}: {
  children: React.ReactNode
  isFirst?: boolean
  report: any
}) => (
  <div
    style={{ pageBreakBefore: isFirst ? 'auto' : 'always', minHeight: '297mm' }}
    className={`px-12 pt-8 pb-8 relative bg-white flex flex-col justify-between ${!isFirst ? 'html2pdf__page-break' : ''}`}
  >
    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden">
      <img
        src={logoImg}
        alt="Watermark"
        className="w-[180mm] object-contain -rotate-45"
        crossOrigin="anonymous"
      />
    </div>
    <div className="relative z-10 flex-1 w-full flex flex-col">{children}</div>
    <ReportFooter report={report} />
  </div>
)
