"use client";

import { SVGProps } from "react";

export function IconCart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
      {...props}
    >
      <rect x="3.5" y="6" width="17" height="12" rx="2" ry="2" />
      <path d="M3.5 10h17" />
      <path d="M7 14h4" />
    </svg>
  );
}
