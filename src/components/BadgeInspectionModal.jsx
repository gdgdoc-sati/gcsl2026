import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaExternalLinkAlt, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { DEFAULT_SYLLABUS_LABS } from '../data/cloudStudySyllabus';

export const BadgeInspectionModal = ({ participant, syllabusLabs, onClose }) => {
  if (!participant) return null;

  const { name, avatar, profileUrl, completedLabs, verifiedCount, totalProfileBadges } = participant;
  const labs = Array.isArray(syllabusLabs) && syllabusLabs.length > 0 ? syllabusLabs : DEFAULT_SYLLABUS_LABS;
  const completedMap = new Map();
  (completedLabs || []).forEach((l) => {
    if (l.id) completedMap.set(l.id, l);
    if (l.title) completedMap.set(l.title, l);
  });

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={avatar}
              alt={name}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  name || 'User'
                )}&background=4285F4&color=fff&bold=true&rounded=true&size=128`;
              }}
              className="w-12 h-12 rounded-full p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <span className="truncate">{name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-google-blue/10 text-google-blue font-bold shrink-0">
                  {verifiedCount} / {labs.length} Labs
                </span>
              </h3>
              {profileUrl && (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-google-blue hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-full"
                >
                  <span>Google Cloud Skills Boost Profile</span>
                  <FaExternalLinkAlt size={9} />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Syllabus Progress Subtitle */}
        <div className="py-2.5 px-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl my-3 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 border border-blue-100 dark:border-blue-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <FaInfoCircle className="text-google-blue shrink-0" size={13} />
            <span>
              Real-time verified from Google Cloud Skills Boost profile against this Study Jam&apos;s syllabus.
            </span>
          </div>
          {totalProfileBadges > 0 && (
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
              Total Badges: {totalProfileBadges}
            </span>
          )}
        </div>

        {/* Syllabus Badges Checklist */}
        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
          {labs.map((lab, idx) => {
            const completedLab = completedMap.get(lab.id) || completedMap.get(lab.title);
            const isCompleted = !!completedLab;
            return (
              <div
                key={lab.id || idx}
                onClick={() => lab.url && window.open(lab.url, '_blank', 'noopener,noreferrer')}
                title={lab.url ? 'Click to open course in new tab' : undefined}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  lab.url ? 'cursor-pointer hover:border-google-blue/50 hover:shadow-sm' : ''
                } ${
                  isCompleted
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      completedLab?.badgeImage ? (
                        <img src={completedLab.badgeImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FaCheckCircle size={14} />
                      )
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {lab.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lab.url && (
                        <span className="text-[11px] text-google-blue hover:underline inline-flex items-center gap-1">
                          <span>Course Link</span>
                          <FaExternalLinkAlt size={8} />
                        </span>
                      )}
                      {isCompleted && completedLab?.earnedDate && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          • Earned: {completedLab.earnedDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {isCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default BadgeInspectionModal;

