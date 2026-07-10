import React from 'react'
import { PageBlock, ReportHeader } from './PDFHeaderFooter'
import { formatDate } from './PDFFormatters'

export const PDFGeneralInfo = ({
  report,
  cliente,
  autor,
}: {
  report: any
  cliente: any
  autor: any
}) => (
  <PageBlock report={report}>
    <ReportHeader report={report} />
    <div className="mb-4 text-[12px] w-full">
      <div className="bg-slate-800 text-white p-1.5 font-medium mb-1.5 uppercase text-[13px] tracking-wider">
        Dados do Cliente e Relatório
      </div>
      <table className="w-full border-collapse border border-slate-300">
        <tbody>
          <tr>
            <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
              Empresa
            </td>
            <td className="border border-slate-300 p-2 w-3/4 font-semibold text-slate-900">
              {cliente.nome_empresa || 'N/A'}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
              CNPJ
            </td>
            <td className="border border-slate-300 p-2 text-slate-900">{cliente.cnpj || 'N/A'}</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
              Endereço
            </td>
            <td className="border border-slate-300 p-2 text-slate-900">
              {cliente.endereco || 'N/A'}
            </td>
          </tr>
          {report.obra && (
            <tr>
              <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
                Obra
              </td>
              <td className="border border-slate-300 p-2 text-slate-900">{report.obra}</td>
            </tr>
          )}
          <tr>
            <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
              Nº Relatório
            </td>
            <td className="border border-slate-300 p-2 font-normal text-black">
              {report.numero_relatorio}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
              Nº Proposta
            </td>
            <td className="border border-slate-300 p-2 text-slate-900">
              {report.numero_proposta || 'N/A'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="mb-4 text-[12px] w-full">
      <div className="bg-slate-800 text-white p-1.5 font-medium mb-1.5 uppercase text-[13px] tracking-wider">
        Dados da Execução
      </div>
      <table className="w-full border-collapse border border-slate-300">
        <tbody>
          <tr>
            <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
              Data Início
            </td>
            <td className="border border-slate-300 p-2 w-1/4 text-slate-900">
              {formatDate(report.data_execucao)}
            </td>
            <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
              Data Fim
            </td>
            <td className="border border-slate-300 p-2 w-1/4 text-slate-900">
              {formatDate(report.data_fim)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
              Próxima Manutenção
            </td>
            <td className="border border-slate-300 p-2 text-slate-900">
              {formatDate(report.proxima_manutencao)}
            </td>
            <td className="border border-slate-300 p-2 font-medium bg-slate-100 text-slate-700">
              Executor Responsável
            </td>
            <td className="border border-slate-300 p-2 font-semibold text-slate-900">
              {report.responsavel_tecnico || 'N/A'}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
              Acompanhante
            </td>
            <td className="border border-slate-300 p-2 w-1/4 text-slate-900">
              {report.acompanhante || 'N/A'}
            </td>
            <td className="border border-slate-300 p-2 font-medium w-1/4 bg-slate-100 text-slate-700">
              Aprovador do Relatório
            </td>
            <td className="border border-slate-300 p-2 w-1/4 text-slate-900">
              {report.aprovador_relatorio || 'N/A'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {report.observacoes && (
      <div className="mb-4 text-[12px] w-full flex-1">
        <div className="bg-slate-800 text-white p-1.5 font-medium mb-1.5 uppercase text-[13px] tracking-wider">
          Observações
        </div>
        <table className="w-full border-collapse border border-slate-300">
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2 text-slate-900 align-top">
                <p className="whitespace-pre-wrap leading-relaxed font-normal">
                  {report.observacoes}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
  </PageBlock>
)
