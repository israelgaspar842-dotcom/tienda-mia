"use client";

import { useState } from "react";

export function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="transition-all duration-300">
      <p className={`text-xs text-slate-600 dark:text-neutral-500 leading-relaxed transition-all duration-300 ${!isExpanded ? "line-clamp-2" : ""}`}>
        {text}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-1.5 text-[11px] font-semibold text-zinc-500 hover:text-orange-500 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors"
      >
        {isExpanded ? "Ver menos" : "Ver más"}
      </button>
    </div>
  );
}

export default ExpandableDescription;
