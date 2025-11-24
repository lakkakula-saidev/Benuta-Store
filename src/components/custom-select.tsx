"use client";

import { useState, useEffect, useRef } from "react";

interface Option {
  key: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.key === value);

  return (
    <div className="relative" ref={selectRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 flex justify-between items-center cursor-pointer"
      >
        <span>{selectedOption?.label ?? placeholder ?? ""}</span>
        <svg
          className="h-4 w-4 text-slate-500"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 8l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-xl shadow-sm">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                onChange(opt.key);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 text-left cursor-pointer flex justify-between items-center"
            >
              <span>{opt.label}</span>
              {opt.key === value && (
                <svg
                  className="h-4 w-4 text-slate-900"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
