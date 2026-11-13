import React, { useState } from 'react';
import { FaWhatsapp, FaEnvelope, FaCopy, FaCheck } from 'react-icons/fa';

const CONTACTS = [
  {
    id: 'deepak',
    type: 'whatsapp',
    name: 'Deepak Gupta',
    value: '+91 77718 02940',
    rawHref: 'https://wa.me/917771802940',
    icon: FaWhatsapp,
    defaultColor: 'text-[#25D366]',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    badgeColor: 'text-emerald-400 dark:text-emerald-500',
    actionLabel: 'Click to chat on WhatsApp',
  },
  {
    id: 'safal',
    type: 'whatsapp',
    name: 'Safal Tiwari',
    value: '+91 6260584403',
    rawHref: 'https://wa.me/916260584403',
    icon: FaWhatsapp,
    defaultColor: 'text-[#25D366]',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    badgeColor: 'text-google-blue dark:text-blue-400',
    actionLabel: 'Click to chat on WhatsApp',
  },
  {
    id: 'email',
    type: 'email',
    name: 'GDG on Campus SATI',
    value: 'satigdgoncampus@gmail.com',
    rawHref: 'mailto:satigdgoncampus@gmail.com',
    icon: FaEnvelope,
    defaultColor: 'text-google-red',
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-950/30',
    badgeColor: 'text-google-red dark:text-red-400',
    actionLabel: 'Click to send email',
  },
];

export default function ContactDock() {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e, contact) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(contact.value);
      setCopiedId(contact.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <aside
      aria-label="Contact and Query Information"
      className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3 px-1 sm:px-2 rounded-r-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-l-0 border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 select-none"
    >
      <div className="text-[8px] sm:text-[9px] font-black tracking-widest text-slate-400 uppercase py-0.5 hidden sm:block">
        Query
      </div>
      {CONTACTS.map((item) => {
        const Icon = item.icon;
        const isCopied = copiedId === item.id;

        return (
          <div key={item.id} className="relative group flex items-center justify-center">
            <a
              href={item.rawHref}
              target={item.type === 'whatsapp' ? '_blank' : undefined}
              rel={item.type === 'whatsapp' ? 'noopener noreferrer' : undefined}
              aria-label={`${item.name} (${item.value})`}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${item.defaultColor} ${item.hoverBg}`}
            >
              <Icon className="text-[14px] sm:text-[16px]" />
            </a>

            {/* Flyout Tooltip — desktop only (hidden below md) */}
            <div
              role="tooltip"
              className="hidden md:block pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap"
            >
              <div className="relative px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs shadow-xl flex flex-col gap-0.5 pointer-events-auto">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${item.badgeColor}`}>
                    {item.name}
                  </span>
                  <button
                    onClick={(e) => handleCopy(e, item)}
                    title="Copy to clipboard"
                    className="p-1 rounded hover:bg-slate-800 dark:hover:bg-slate-100 text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <FaCheck size={10} className="text-emerald-400" />
                    ) : (
                      <FaCopy size={10} />
                    )}
                  </button>
                </div>
                <span className="font-mono text-xs font-semibold tracking-wide">
                  {item.value}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {item.actionLabel}
                </span>
                {/* Arrow */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-white" />
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
