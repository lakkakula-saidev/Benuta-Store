"use client";

import { SVGProps } from "react";

type IconHeartProps = SVGProps<SVGSVGElement> & {
  filled?: boolean;
};

export function IconHeart({
  filled = false,
  className,
  ...props
}: IconHeartProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M12.62 20.62a1 1 0 0 1-1.24 0C7.63 17.42 4 14.31 4 10.25 4 7.35 6.35 5 9.25 5c1.41 0 2.67.57 3.5 1.5.83-.93 2.09-1.5 3.5-1.5C19.65 5 22 7.35 22 10.25c0 4.06-3.63 7.17-8.38 10.37Z" />
    </svg>
  );
}
