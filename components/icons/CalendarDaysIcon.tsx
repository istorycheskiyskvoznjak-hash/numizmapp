
import React from 'react';

const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M-12 14.25h.008v.008H-12v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 12h.008v.008h-.008V12Zm0 3.75h.008v.008h-.008v-.008Zm3.75-3.75h.008v.008h-.008V12Zm0 3.75h.008v.008h-.008v-.008Zm-3.75-7.5h.008v.008h-.008v-.008Zm3.75 0h.008v.008h-.008V8.25Z" />
  </svg>
);

export default CalendarDaysIcon;
