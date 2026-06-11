import React from 'react'
import { PageBlock, ReportHeader } from './PDFHeaderFooter'

export const PDFEquipmentIndex = ({ report, equipments }: { report: any; equipments: any[] }) => {
  const subestacoes = Array.from(
    new Set(equipments.map((eq) => eq.dados_tecnicos?.subestacao || 'Geral')),
  )

  return (
    <PageBlock report={report}>
      <ReportHeader report={report} />
      <div className="mb-4 text-[12px] w-full flex-1">
        <div className="bg-slate-800 text-white p-1.5 font-medium mb-1.5 uppercase text-[13px] tracking-wider">
          Índice de Equipamentos Inspecionados
        </div>

        {subestacoes.map((sub) => {
          const subEqs = equipments.filter(
            (eq) => (eq.dados_tecnicos?.subestacao || 'Geral') === sub,
          )
          return (
            <div key={String(sub)} className="mb-4">
              <h3 className="font-semibold text-slate-800 text-[13px] uppercase mb-1.5 border-b-2 border-blue-900 inline-block pb-0.5">
                Subestação: {String(sub)}
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-1 text-center font-semibold text-slate-700 w-12">
                      #
                    </th>
                    <th className="border border-slate-300 p-1 text-left font-semibold text-slate-700">
                      Equipamento
                    </th>
                    <th className="border border-slate-300 p-1 text-left font-semibold text-slate-700">
                      Circuito
                    </th>
                    <th className="border border-slate-300 p-1 text-left font-semibold text-slate-700">
                      Identificação / Série
                    </th>
                    <th className="border border-slate-300 p-1 text-center font-semibold text-slate-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subEqs.map((eq) => {
                    const globalIndex = equipments.findIndex((e) => e.id === eq.id) + 1
                    const numStr =
                      eq.dados_tecnicos?.numero ||
                      eq.dados_tecnicos?.identificacao ||
                      eq.dados_tecnicos?.numero_serie ||
                      eq.dados_tecnicos?.serie ||
                      eq.dados_tecnicos?.numero_tag ||
                      '-'
                    const status = eq.parecer?.parecer || '-'
                    const statusColor =
                      status === 'Conforme'
                        ? 'text-green-700 bg-green-50'
                        : status === 'Não Conforme'
                          ? 'text-red-700 bg-red-50'
                          : status === 'Possui Ressalvas'
                            ? 'text-amber-700 bg-amber-50'
                            : ''

                    return (
                      <tr key={eq.id}>
                        <td className="border border-slate-300 p-1 text-center font-medium">
                          {eq.ordem || globalIndex}
                        </td>
                        <td className="border border-slate-300 p-1 font-semibold text-slate-800">
                          {eq.tipo_equipamento}
                        </td>
                        <td className="border border-slate-300 p-1">
                          {eq.dados_tecnicos?.circuito || '-'}
                        </td>
                        <td className="border border-slate-300 p-1">{numStr}</td>
                        <td
                          className={`border border-slate-300 p-1 text-center font-semibold uppercase text-[10px] tracking-wider ${statusColor}`}
                        >
                          {status}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </PageBlock>
  )
}
