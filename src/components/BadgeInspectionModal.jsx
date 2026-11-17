import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaExternalLinkAlt, FaCheckCircle, FaInfoCircle, FaCoins } from 'react-icons/fa';
import { DEFAULT_SYLLABUS_LABS } from '../data/cloudStudySyllabus';

export const BadgeInspectionModal = ({ participant, syllabusLabs, onClose }) => {
  if (!participant) return null;

  const { name, avatar, profileUrl, completedLabs, verifiedCount, totalProfileBadges, cloudProfileName } = participant;
  const labs = Array.isArray(syllabusLabs) && syllabusLabs.length > 0 ? syllabusLabs : DEFAULT_SYLLABUS_LABS;
  const completedMap = new Map();
  (completedLabs || []).forEach((l) => {
    if (l.id) completedMap.set(l.id, l);
    if (l.title) completedMap.set(l.title, l);
  });

  // Lock background screen scrolling and prevent scroll leakage while pop-up card is open
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
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span className="truncate">{name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-google-blue/10 text-google-blue font-bold shrink-0">
                  {verifiedCount} / {labs.length} Labs
                </span>
                {(participant.hasClaimedCredits || verifiedCount > 0 || totalProfileBadges > 0 || (participant.points || 0) > 0 || participant.hasTourLab) ? (
                  <span
                    title="Claimed enrollment code (9 credits) & activated 200/400 credits subscription"
                    className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-bold shrink-0 flex items-center gap-1"
                  >
                    <FaCoins size={10} className="text-amber-500 shrink-0" />
                    <span>9 &amp; 200 Credits Claimed</span>
                    {/* {(participant.points || 0) > 0 && (
                      <span className="opacity-80">({participant.points} pts)</span>
                    )} */}
                  </span>
                ) : (
                  <span
                    title="Has not redeemed the 9 credits enrollment code yet"
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium shrink-0 flex items-center gap-1"
                  >
                    <span>Credits Pending</span>
                  </span>
                )}
              </h3>
              {cloudProfileName && cloudProfileName.trim().toLowerCase() !== name.trim().toLowerCase() && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Cloud Username: <span className="font-semibold text-slate-700 dark:text-slate-300">{cloudProfileName}</span>
                </p>
              )}
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
              Real-time verified from Google Cloud Skills Boost profile against this Study Learn&apos;s syllabus.
            </span>
          </div>
          {totalProfileBadges > 0 && (
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
              Total Badges: {totalProfileBadges}
            </span>
          )}
        </div>

        {/* Syllabus Badges Checklist */}
        <div className="overflow-y-auto space-y-2 pr-1 flex-1 overscroll-contain">
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

