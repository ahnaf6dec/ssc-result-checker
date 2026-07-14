import React from 'react';
import { LandmarkIcon } from 'lucide-react';
type PortalHeaderProps = {
  compact?: boolean;
};
export function PortalHeader({ compact = false }: PortalHeaderProps) {
  return (
    <header
      className={`relative flex min-h-[112px] items-center justify-center overflow-hidden rounded-lg bg-[#009650] px-5 py-5 text-center text-white shadow-sm ${compact ? 'mb-6' : 'mb-10'}`}>

      <div
        className="absolute left-5 hidden items-center gap-2 md:flex"
        aria-hidden="true">

        <img
          src="https://raw.githubusercontent.com/ahnaf6dec/book-store/refs/heads/main/logo.png"
          alt=""
          className="h-14 w-14 object-contain" />

      </div>
      <LandmarkIcon
        className="absolute left-5 h-8 w-8 md:hidden"
        aria-hidden="true" />


      <div>
        <h1 className="text-lg font-medium uppercase tracking-wide sm:text-[1.35rem]">
          Web Based Result Publication System for Education Board
        </h1>
        <p className="mt-1 text-xs uppercase tracking-wide sm:text-sm">
          JSC/JDC/SSC/DAKHIL/HSC/ALIM and Equivalent Examination
        </p>
      </div>
    </header>);

}