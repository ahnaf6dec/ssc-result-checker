import React from 'react';
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PortalFooter } from '../components/PortalFooter';
import { PortalHeader } from '../components/PortalHeader';
import { ResultDisplay } from '../components/ResultDisplay';
import type { ResultRecord } from '../types/results';
const examTitles: Record<string, string> = {
  SSC: 'SSC or Equivalent',
  DAKHIL: 'SSC or Equivalent',
  HSC: 'HSC or Equivalent',
  ALIM: 'HSC or Equivalent',
  JSC: 'JSC or Equivalent',
  JDC: 'JSC or Equivalent'
};
export function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const record = (
  location.state as {
    record?: ResultRecord;
  } | null)?.
  record;
  // No result in navigation state — send the user back to search.
  if (!record) {
    return <Navigate to="/" replace />;
  }
  const examLabel = examTitles[record.examination] ?? record.examination;
  const ActionButtons = () =>
  <div className="no-print mb-6 flex justify-center gap-2">
      <button
      type="button"
      onClick={() => navigate('/')}
      className="inline-flex items-center gap-1.5 rounded bg-[#009650] px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#007a41] focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2">
      
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Search Again
      </button>
      <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded bg-[#5bc0de] px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#31b0d5] focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2">
      
        <PrinterIcon className="h-4 w-4" aria-hidden="true" />
        Print
      </button>
    </div>;

  return (
    <main className="print-page min-h-screen w-full bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1140px]">
        <div className="no-print">
          <PortalHeader compact />
        </div>

        <section aria-labelledby="result-title">
          <h2
            id="result-title"
            className="mb-6 text-center text-xl font-normal text-[#222] sm:text-[1.4rem]">
            
            Result of {examLabel} Examination - {record.year}
          </h2>

          <ActionButtons />

          <ResultDisplay record={record} />

          <div className="no-print my-6">
            <ActionButtons />
          </div>
        </section>

        <PortalFooter />
      </div>
    </main>);

}