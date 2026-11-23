import React from 'react';
import { X } from 'lucide-react';

interface GranthaModalProps {
  open: boolean;
  onClose: () => void;
}

export const GranthaModal: React.FC<GranthaModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grantha-title"
    >
      <div className="w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-2xl border border-[#d4af37]/45 bg-[#1a0f0a] text-[#f5ead6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#d4af37]/25 bg-[#23140e]">
          <div>
            <h2 id="grantha-title" className="font-display text-lg sm:text-xl font-bold text-[#f7e199]">
              Grantha · Royal Rules of Chaupar
            </h2>
            <p className="text-xs text-[#c5b08f] mt-0.5">
              Ancient Mahabharata Dyut Krida vs. Modern Ludo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Grantha rules"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#d4c09e] hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto sabha-scroll p-5 space-y-5 text-sm leading-relaxed text-[#e6d7bd]">
          <section>
            <h3 className="font-display text-base font-bold text-[#d4af37] mb-1.5">
              01. Path of the 84 Squares
            </h3>
            <p>
              Each player begins with 4 sculpted Gotis in their Royal Kosh (tray). Unlike Ludo, you do not need a 6 to enter—any die value deploys a Goti down your own arm&apos;s center lane toward the outer tip (Row 8). From there, every piece travels <strong>anti-clockwise</strong> around the 68-square outer perimeter of all four arms before ascending its own private Middle Column into Central Home (<strong>Meru</strong>) by an <strong>exact throw</strong>.
            </p>
          </section>

          <section>
            <h3 className="font-display text-base font-bold text-[#d4af37] mb-1.5">
              02. Ancient Stick Dice (Pashaka) &amp; Split Moves
            </h3>
            <p>
              Three rectangular 4-sided ivory stick dice bear only the numbers <strong>1, 2, 5, and 6</strong> (never 3 or 4). Because three sticks are thrown independently, you may <strong>split</strong> the three values across 1, 2, or 3 different Gotis—or tap <strong>Combine Dice</strong> to sum selected sticks onto one piece. Rolling matching triples (<code>1-1-1</code>, <code>2-2-2</code>, <code>5-5-5</code>, or <code>6-6-6</code>) earns a Bonus Roll (<em>Punah-Daav</em>). Three consecutive bonus throws trigger <strong>Teen-Trik</strong>: the third throw is burned and the turn passes immediately!
            </p>
            <p className="mt-2 text-xs text-[#c5b08f]">
              Optional 6 Cowrie Shells (Kaudi): 0 mouth-up = 25 (bonus), 1 = 10 (bonus), 2–5 = face count, 6 = 12 (bonus).
            </p>
          </section>

          <section>
            <h3 className="font-display text-base font-bold text-[#d4af37] mb-1.5">
              03. Safe Squares (Charkoni) &amp; Capture (Maar / Tod)
            </h3>
            <p>
              Twelve squares embroidered with golden lotus crosses (<strong>X</strong>)—at Row 5 on both outer columns and Row 8 at each arm&apos;s outer tip—are Safe Squares where no piece can ever be cut. Landing on a single enemy Goti on any non-safe square executes a <strong>Capture (Maar)</strong>: the enemy Goti returns to its Royal Kosh, you earn an immediate <strong>Bonus Roll</strong>, and you fulfill the <strong>Tod</strong> requirement! When <em>Strict Mahabharata Rule</em> is ON, your Home Column remains locked (pieces loop around the outer circuit) until you or your ally capture at least one enemy Goti.
            </p>
          </section>

          <section>
            <h3 className="font-display text-base font-bold text-[#d4af37] mb-1.5">
              04. Twin Guard (Jodi) Formations
            </h3>
            <p>
              Landing two of your own Gotis on the exact same square unites them into a <strong>Jodi (Pair)</strong>. A single enemy Goti <strong>cannot</strong> cut a Jodi! Only an opponent&apos;s Jodi—moving together as a unified pair using an <strong>even die total divided by 2</strong> (e.g., a 6 moves the pair 3 squares)—can cut another Jodi. You can move a Jodi together via the <em>Jodi Pair</em> toggle or break it by moving a single piece.
            </p>
          </section>

          <section>
            <h3 className="font-display text-base font-bold text-[#d4af37] mb-1.5">
              05. 2v2 Jodidar Team Alliance
            </h3>
            <p>
              Partners sit directly opposite each other (South + North vs. East + West). Allies never capture one another and share the Tod Home unlock. Once you bring all 4 of your own Gotis into Central Meru, you continue rolling on your turn to march your partner&apos;s remaining pieces to victory!
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#d4af37]/20 bg-[#21130d] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 rounded-xl bg-[#8b0000] border border-[#d4af37]/60 text-sm font-semibold text-[#fff5dc] hover:bg-[#a60e0e] transition-colors cursor-pointer"
          >
            Return to Sabha
          </button>
        </div>
      </div>
    </div>
  );
};
