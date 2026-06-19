import React, { Fragment } from 'react'
import { PageBlock, ReportHeader } from './PDFHeaderFooter'
import { getLabel, formatTestValue, formatDate } from './PDFFormatters'
import { getEquipmentFields } from '@/lib/equipment-templates'
import { formatNumberPtBR } from '@/lib/format'
import pb from '@/lib/pocketbase/client'

export const PDFEquipmentDetails = ({
  report,
  eq,
  globalIndex,
}: {
  report: any
  eq: any
  globalIndex: number
}) => {
  const fields = getEquipmentFields(eq.tipo_equipamento)
  const mappedKeys = new Set<string>()

  const orderedData = fields
    .filter((f) => {
      if (f.dependsOn && eq.dados_tecnicos[f.dependsOn.field] !== f.dependsOn.value) return false
      const val = eq.dados_tecnicos[f.name]
      return val !== undefined && val !== null && val !== ''
    })
    .map((f) => {
      mappedKeys.add(f.name)
      return { key: f.name, label: f.label, value: eq.dados_tecnicos[f.name] }
    })

  const unmappedData = Object.entries(eq.dados_tecnicos || {})
    .filter(([k, val]) => !mappedKeys.has(k) && val !== undefined && val !== null && val !== '')
    .map(([k, val]) => ({ key: k, label: getLabel(k, eq.tipo_equipamento), value: val }))
  const allData = [...orderedData, ...unmappedData]

  return (
    <PageBlock report={report}>
      <ReportHeader report={report} />
      <div className="w-full flex-1 border border-slate-400 bg-white text-[11px] mb-4">
        <div className="bg-slate-200 text-slate-900 p-1.5 font-semibold text-[13px] border-b border-slate-400 uppercase tracking-wide">
          {globalIndex}. EQUIPAMENTO: {eq.tipo_equipamento}
        </div>
        <div className="p-3 space-y-1.5">
          {allData.length > 0 && (
            <div>
              <div className="font-semibold text-slate-800 mb-1.5 border-b border-slate-200 pb-0.5 text-[13px] uppercase tracking-wider">
                Características Técnicas
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                {allData.map(({ key, label, value }) => (
                  <div
                    key={key}
                    className="flex items-baseline text-[11px] border-b border-slate-100 pb-1"
                  >
                    <span className="font-medium text-slate-600 whitespace-nowrap pr-2 leading-tight">
                      {label}:
                    </span>
                    <span className="text-slate-900 break-words leading-tight">
                      {typeof value === 'boolean'
                        ? value
                          ? 'Sim'
                          : 'Não'
                        : eq.tipo_equipamento === 'Transformador' && key === 'impedancia'
                          ? typeof value === 'number' ||
                            (!isNaN(
                              Number(
                                String(value).includes(',')
                                  ? String(value).replace(/\./g, '').replace(',', '.')
                                  : String(value).replace(/\./g, ''),
                              ),
                            ) &&
                              String(value).trim() !== '')
                            ? formatNumberPtBR(
                                typeof value === 'string'
                                  ? Number(
                                      String(value).includes(',')
                                        ? String(value).replace(/\./g, '').replace(',', '.')
                                        : String(value).replace(/\./g, ''),
                                    )
                                  : value,
                                2,
                                2,
                              )
                            : String(value)
                          : eq.tipo_equipamento === 'QGBT' &&
                              [
                                'corrente_ajuste_longo',
                                'temporizacao_longo',
                                'corrente_ajuste_curto',
                                'temporizacao_curto',
                                'corrente_ajuste_instantanea',
                              ].includes(key)
                            ? typeof value === 'number' ||
                              (!isNaN(
                                Number(
                                  String(value).includes(',')
                                    ? String(value).replace(/\./g, '').replace(',', '.')
                                    : String(value).replace(/\./g, ''),
                                ),
                              ) &&
                                String(value).trim() !== '')
                              ? formatNumberPtBR(
                                  typeof value === 'string'
                                    ? Number(
                                        String(value).includes(',')
                                          ? String(value).replace(/\./g, '').replace(',', '.')
                                          : String(value).replace(/\./g, ''),
                                      )
                                    : value,
                                  1,
                                  1,
                                )
                              : String(value)
                            : eq.tipo_equipamento === 'QGBT' &&
                                [
                                  'subestacao',
                                  'numero',
                                  'corrente_nominal',
                                  'rele_minima_tensao',
                                  'rele_abertura',
                                  'rele_fechamento',
                                  'motorizacao',
                                ].includes(key) &&
                                (typeof value === 'number' ||
                                  (typeof value === 'string' &&
                                    /^-?\d+(\.\d+)*(,\d+)?$/.test(value.trim())))
                              ? formatNumberPtBR(
                                  typeof value === 'string'
                                    ? Number(
                                        value.trim().includes(',')
                                          ? value.trim().replace(/\./g, '').replace(',', '.')
                                          : value.trim().replace(/\./g, ''),
                                      )
                                    : value,
                                  0,
                                  0,
                                )
                              : eq.tipo_equipamento === 'QGBT' &&
                                  (typeof value === 'number' ||
                                    (typeof value === 'string' &&
                                      /^-?\d+(\.\d+)*(,\d+)?$/.test(value.trim())))
                                ? formatNumberPtBR(
                                    typeof value === 'string'
                                      ? Number(
                                          value.trim().includes(',')
                                            ? value.trim().replace(/\./g, '').replace(',', '.')
                                            : value.trim().replace(/\./g, ''),
                                        )
                                      : value,
                                    2,
                                    2,
                                  )
                                : typeof value === 'number'
                                  ? formatNumberPtBR(value)
                                  : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eq.testes && eq.testes.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold text-slate-800 mb-1.5 border-b border-slate-200 pb-0.5 text-[13px] uppercase tracking-wider">
                Resultados dos Testes
              </div>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-1 text-left text-slate-700 font-medium w-[15%] border-r border-slate-200">
                        Data
                      </th>
                      <th className="p-1 text-left text-slate-700 font-medium w-[30%] border-r border-slate-200">
                        Teste Realizado
                      </th>
                      <th className="p-1 text-left text-slate-700 font-medium w-[55%]">
                        Resultados
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {eq.testes.map((t: any, idx: number) => (
                      <Fragment key={t.id}>
                        <tr className={idx > 0 ? 'border-t border-slate-200' : ''}>
                          <td className="p-1 align-top border-r border-slate-200 font-medium text-slate-900">
                            {formatDate(t.data_teste)}
                          </td>
                          <td className="p-1 align-top border-r border-slate-200 text-slate-900">
                            {t.tipo_teste}
                          </td>
                          <td className="p-1 align-top text-blue-900 font-semibold whitespace-pre-wrap">
                            {formatTestValue(t, eq.tipo_equipamento).map((l, lIdx) => (
                              <span key={lIdx} className="block leading-tight">
                                {l}
                              </span>
                            ))}
                          </td>
                        </tr>
                        <tr className="bg-slate-50/50 border-t border-slate-200">
                          <td colSpan={3} className="px-1.5 py-1 text-slate-600">
                            <span className="font-medium">Equipamento Utilizado:</span>{' '}
                            {t.equipamento_utilizado}
                          </td>
                        </tr>
                        {t.observacoes && (
                          <tr className="bg-yellow-50/50 border-t border-slate-200">
                            <td colSpan={3} className="px-1.5 py-1 text-slate-700 italic">
                              <span className="font-medium not-italic">Observações:</span>{' '}
                              <span className="whitespace-pre-wrap">{t.observacoes}</span>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {eq.parecer && (
            <div className="mt-2">
              <div className="font-semibold text-slate-800 mb-1.5 border-b border-slate-200 pb-0.5 text-[13px] uppercase tracking-wider">
                Parecer Técnico Específico
              </div>
              <div className="border-l-4 border-slate-400 pl-3 py-1 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 mb-0.5 text-[11px]">
                  <span className="font-medium text-slate-700">Status:</span>
                  <span
                    className={`font-semibold uppercase px-2 py-0.5 rounded text-[11px] ${eq.parecer.parecer === 'Conforme' ? 'bg-green-100 text-green-800' : eq.parecer.parecer === 'Não Conforme' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                  >
                    {eq.parecer.parecer}
                  </span>
                </div>
                {eq.parecer.justificativa_mudanca && (
                  <div className="text-[11px]">
                    <span className="font-medium text-slate-700 block mb-0.5">
                      Justificativa da Mudança:
                    </span>
                    <span className="text-slate-900 block bg-white p-1.5 border border-slate-200 rounded">
                      {eq.parecer.justificativa_mudanca}
                    </span>
                  </div>
                )}
                {eq.parecer.observacoes && (
                  <div className="text-[11px]">
                    <span className="font-medium text-slate-700 block mb-0.5">Observações:</span>
                    <span className="text-slate-900 block whitespace-pre-wrap bg-white p-1.5 border border-slate-200 rounded">
                      {eq.parecer.observacoes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {eq.fotos && eq.fotos.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold text-slate-800 mb-1.5 border-b border-slate-200 pb-0.5 text-[13px] uppercase tracking-wider">
                REGISTRO FOTOGRÁFICO
              </div>
              <div className="grid grid-cols-2 gap-2">
                {eq.fotos.map((f: string) => (
                  <img
                    key={f}
                    src={pb.files.getURL(eq, f, { thumb: '800x0' })}
                    crossOrigin="anonymous"
                    className="w-full h-48 object-contain border border-slate-300 rounded shadow-sm bg-slate-50 p-1"
                  />
                ))}
              </div>
            </div>
          )}

          {eq.tipo_equipamento === 'Transformador' &&
            eq.dados_tecnicos?.meio_isolante === 'Óleo Mineral' && (
              <div className="mt-2">
                <div className="font-semibold text-slate-800 mb-1.5 border-b border-slate-200 pb-0.5 text-[13px] uppercase tracking-wider">
                  ANÁLISE DE ÓLEO
                </div>
                <div className="border-l-4 border-slate-400 pl-3 py-2 bg-slate-50">
                  <span className="text-slate-800 text-[11px] font-medium leading-relaxed">
                    As análises de óleo correspondentes a este transformador foram realizadas e os
                    respectivos laudos encontram-se anexados ao final deste documento técnico.
                  </span>
                </div>
              </div>
            )}
        </div>
      </div>
    </PageBlock>
  )
}
