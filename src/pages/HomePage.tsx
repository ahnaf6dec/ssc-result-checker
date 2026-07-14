import React from 'react';
import { PortalFooter } from '../components/PortalFooter';
import { PortalHeader } from '../components/PortalHeader';
import { ResultForm } from '../components/ResultForm';
export function HomePage() {
  return (
    <main className="min-h-screen w-full bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1140px]">
        <PortalHeader />

        <section
          className="mx-auto max-w-[950px] rounded border border-[#e0e0e0] bg-[#fcfcfc] p-5 shadow-sm sm:p-8"
          aria-labelledby="result-search-heading">
          
          <div className="mb-5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <button
              type="button"
              className="font-bold text-[#d9534f] underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[#009650]">
              
              [ বাংলায় দেখুন ]
            </button>
            <button
              type="button"
              className="text-[#002bff] underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[#009650]">
              
              [ Live Web Access Graph ]
            </button>
          </div>

          <h2 id="result-search-heading" className="sr-only">
            Search examination result
          </h2>
          <p className="mb-6 text-[#333]">
            Please provide the following information to view result
          </p>
          <ResultForm />
        </section>

        <PortalFooter />
      </div>
    </main>);

}