import React from 'react';

/**
 * AuroraBackground - Exact animated background from Techfest CA Profile
 * Includes aurora gradient layer and floating tilted glass frames.
 */
export default function AuroraBackground() {
  return (
    <div className="cs-aurora-bg original-aurora-bg" aria-hidden="true">
      <div className="cs-aurora-gradient aurora-gradient-layer" />
      <div className="cs-frames cs-frames-1 glassy-frames-container">
        {[...Array(6)].map((_, i) => (
          <div key={`frame-1-${i}`} className="cs-frame glassy-frame" />
        ))}
      </div>
      <div className="cs-frames cs-frames-2 glassy-frames-container2">
        {[...Array(6)].map((_, i) => (
          <div key={`frame-2-${i}`} className="cs-frame glassy-frame" />
        ))}
      </div>
    </div>
  );
}
