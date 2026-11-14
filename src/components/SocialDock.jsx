import React, { useState, useEffect } from 'react';
import {
  FaInstagram,
  FaLinkedinIn,
  FaGithub,
  FaGoogle,
  FaYoutube,
} from 'react-icons/fa';

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    handle: '@gdgsatividisha',
    url: 'https://www.instagram.com/gdgsatividisha/',
    icon: FaInstagram,
    defaultColor: 'text-[#E4405F]',
    hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-950/30',
    badgeColor: 'text-pink-400',
  },
  {
    name: 'LinkedIn',
    handle: 'GDG on Campus SATI',
    url: 'https://www.linkedin.com/company/gdgoc-sati/',
    icon: FaLinkedinIn,
    defaultColor: 'text-[#0A66C2]',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
    badgeColor: 'text-blue-400',
  },
  {
    name: 'GitHub',
    handle: 'GDGoC-SATI',
    url: 'https://github.com/GDGoC-SATI',
    icon: FaGithub,
    defaultColor: 'text-slate-800 dark:text-white',
    hoverBg: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    badgeColor: 'text-slate-400',
  },
  {
    name: 'GDG Community',
    handle: 'SATI Vidisha Chapter',
    url: 'https://gdg.community.dev/gdg-on-campus-samrat-ashok-technological-institute-vidisha-india/',
    icon: FaGoogle,
    defaultColor: 'text-google-blue',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
    badgeColor: 'text-blue-400',
  },
  {
    name: 'YouTube',
    handle: '@GDGoCSATI',
    url: 'https://www.youtube.com/@GDGoCSATI',
    icon: FaYoutube,
    defaultColor: 'text-[#FF0000]',
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-950/30',
    badgeColor: 'text-red-400',
  },
];

export default function SocialDock({ isAtTop = true }) {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState(0);

  // Tooltips appear one by one with 1 second delay; previous disappears when another appears.
  // Happens only when user is at the top of the page.
  useEffect(() => {
    if (!isAtTop) {
      setActiveTooltipIndex(-1);
      return;
    }

    setActiveTooltipIndex(0);

    const timer = setInterval(() => {
      setActiveTooltipIndex((prev) => (prev + 1) % SOCIAL_LINKS.length);
    }, 1500); // 1 second delay

    return () => clearInterval(timer);
  }, [isAtTop]);

  return (
    <aside
      aria-label="Social media handles"
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3 px-1 sm:px-2 rounded-l-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-r-0 border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 select-none transition-all duration-300 ease-out ${
        isAtTop
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-full opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:pointer-events-auto'
      }`}
    >
      <div className="text-[8px] sm:text-[9px] font-black tracking-widest text-slate-400 uppercase py-0.5 hidden sm:block">
        Social
      </div>
      {SOCIAL_LINKS.map((item, index) => {
        const Icon = item.icon;
        const isCurrentActive = isAtTop && activeTooltipIndex === index;

        return (
          <div key={item.name} className="relative group flex items-center justify-center">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.name}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${item.defaultColor} ${item.hoverBg}`}
            >
              <Icon className="text-[15px] sm:text-[18px]" />
            </a>

            {/* Flyout Tooltip — desktop only (hidden on mobile, undisturbed on desktop) */}
            <div
              role="tooltip"
              className={`hidden md:block absolute right-full mr-2 sm:mr-3 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-50 whitespace-nowrap ${
                isCurrentActive
                  ? 'opacity-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 translate-x-2 pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-x-0 md:group-hover:pointer-events-auto'
              }`}
            >
              <div className="relative px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs shadow-xl flex flex-col gap-0.5">
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${item.badgeColor}`}>
                  {item.name}
                </span>
                <span className="font-medium text-[10px] sm:text-[11px] opacity-90">{item.handle}</span>
                {/* Arrow */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900 dark:border-l-white" />
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
