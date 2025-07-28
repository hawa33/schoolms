"use client";

import React from "react";
import Image from "next/image";
import { Class } from "@prisma/client";

type FilterBarProps = {
  selectedDate: string;
  selectedClassId?: string;
  queryParams: Record<string, string | undefined>;
  viewMode: string;
  classes: Class[];
};

export default function FilterBar({
  selectedDate,
  selectedClassId,
  queryParams,
  viewMode,
  classes,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-4 self-end">
      <input
        type="date"
        defaultValue={selectedDate}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("date", e.target.value);
          window.location.href = url.toString();
        }}
      />

      <select
        defaultValue={selectedClassId || ""}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        onChange={(e) => {
          const url = new URL(window.location.href);
          if (e.target.value) {
            url.searchParams.set("classId", e.target.value);
          } else {
            url.searchParams.delete("classId");
          }
          window.location.href = url.toString();
        }}
      >
        <option value="">All Classes</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
          </option>
        ))}
      </select>

      <div className="flex bg-gray-200 rounded-md">
        <a
          href={`?${new URLSearchParams({
            ...queryParams,
            view: "mark",
          }).toString()}`}
          className={`px-3 py-2 text-sm rounded-l-md ${
            viewMode === "mark"
              ? "bg-lamaYellow text-black"
              : "bg-transparent text-gray-600 hover:bg-gray-300"
          }`}
        >
          Mark
        </a>
        <a
          href={`?${new URLSearchParams({
            ...queryParams,
            view: "reports",
          }).toString()}`}
          className={`px-3 py-2 text-sm rounded-r-md ${
            viewMode === "reports"
              ? "bg-lamaYellow text-black"
              : "bg-transparent text-gray-600 hover:bg-gray-300"
          }`}
        >
          Reports
        </a>
      </div>

      <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
        <Image src="/filter.png" alt="Filter" width={14} height={14} />
      </button>
      <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
        <Image src="/sort.png" alt="Sort" width={14} height={14} />
      </button>
    </div>
  );
}
