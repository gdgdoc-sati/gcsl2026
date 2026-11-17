import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaTimes, FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { DEFAULT_SYLLABUS_LABS, DEFAULT_SYLLABUS_SOURCE_URL } from '../data/cloudStudySyllabus';

export const SyllabusInfoModal = ({ syllabusLabs, sourceUrl, onClose }) => {
  const labs = Array.isArray(syllabusLabs) && syllabusLabs.length > 0 ? syllabusLabs : DEFAULT_SYLLABUS_LABS;
  const sourceSheet = sourceUrl || DEFAULT_SYLLABUS_SOURCE_URL;

  // Lock background screen scrolling while syllabus pop-up is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overscroll-contain"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden overscroll-contain"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FaBookOpen className="text-google-blue text-xl" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Study Learn Syllabus Labs ({labs.length} Courses)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete only <b>challange lab</b> from each lab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {sourceSheet && (
          <div className="py-2.5 px-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl my-3 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 border border-blue-100 dark:border-blue-900/40 shrink-0">
            <div className="flex items-center gap-2">
              <FaInfoCircle size={13} className="text-google-blue shrink-0" />
              <span>Official Syllabus Spreadsheet Reference</span>
            </div>
            <a
              href={sourceSheet}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-google-blue underline shrink-0 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Source Sheet</span>
              <FaExternalLinkAlt size={9} />
            </a>
          </div>
        )}

        <div className="overflow-y-auto space-y-2 pr-1 flex-1 overscroll-contain">
          {labs.map((lab, idx) => (
            <div
              key={lab.id || idx}
              onClick={() => lab.url && window.open(lab.url, '_blank', 'noopener,noreferrer')}
              title={lab.url ? 'Click to open course in new tab' : undefined}
              className={`p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3 transition-all ${
                lab.url ? 'cursor-pointer hover:border-google-blue/60 hover:shadow-md' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-google-blue/10 text-google-blue flex items-center justify-center font-bold text-xs shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {lab.title}
                  </h4>
                  {lab.url && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{lab.url}</p>
                  )}
                </div>
              </div>
              {lab.url && (
                <div
                  className="p-2 rounded-xl text-slate-400 hover:text-google-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Open Course"
                >
                  <FaExternalLinkAlt size={11} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SyllabusInfoModal;

