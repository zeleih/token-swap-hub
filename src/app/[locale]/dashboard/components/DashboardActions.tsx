"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import UserProfileModal from "./UserProfileModal";
import LeaderboardModal from "./LeaderboardModal";
import TransferPointsModal from "./TransferPointsModal";

type DashboardActionTexts = {
  profile: string;
  displayName: string;
  displayNamePlaceholder: string;
  showOnLeaderboard: string;
  saveProfile: string;
  saving: string;
  profileSaved: string;
  close: string;
  leaderboard: string;
  contributionBoard: string;
  consumptionBoard: string;
  rank: string;
  user: string;
  tokens_count: string;
  noData: string;
  day: string;
  week: string;
  month: string;
  year: string;
  all: string;
  transferPoints: string;
  toUsername: string;
  toUsernamePlaceholder: string;
  transferAmount: string;
  transferAmountPlaceholder: string;
  confirmTransfer: string;
  confirmPlaceholder: string;
  doTransfer: string;
  transferring: string;
};

function ModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export default function DashboardActions({
  user,
  texts,
}: {
  user: { displayName: string | null; showOnLeaderboard: boolean };
  texts: DashboardActionTexts;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowLeaderboard(true)}
          className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg"
        >
          🏆 {texts.leaderboard}
        </button>
        <button
          onClick={() => setShowTransfer(true)}
          className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg"
        >
          🎁 {texts.transferPoints}
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg"
        >
          ⚙️ {texts.profile}
        </button>
      </div>

      {showProfile && (
        <ModalPortal>
          <UserProfileModal
            user={user}
            texts={{
              title: texts.profile,
              displayName: texts.displayName,
              displayNamePlaceholder: texts.displayNamePlaceholder,
              showOnLeaderboard: texts.showOnLeaderboard,
              save: texts.saveProfile,
              saving: texts.saving,
              saved: texts.profileSaved,
              close: texts.close,
            }}
            onClose={() => setShowProfile(false)}
          />
        </ModalPortal>
      )}

      {showLeaderboard && (
        <ModalPortal>
          <LeaderboardModal
            texts={{
              title: texts.leaderboard,
              contributionBoard: texts.contributionBoard,
              consumptionBoard: texts.consumptionBoard,
              rank: texts.rank,
              user: texts.user,
              tokens_count: texts.tokens_count,
              noData: texts.noData,
              day: texts.day,
              week: texts.week,
              month: texts.month,
              year: texts.year,
              all: texts.all,
              close: texts.close,
            }}
            onClose={() => setShowLeaderboard(false)}
          />
        </ModalPortal>
      )}

      {showTransfer && (
        <ModalPortal>
          <TransferPointsModal
            texts={{
              title: texts.transferPoints,
              toUsername: texts.toUsername,
              toUsernamePlaceholder: texts.toUsernamePlaceholder,
              amount: texts.transferAmount,
              amountPlaceholder: texts.transferAmountPlaceholder,
              confirm: texts.confirmTransfer,
              confirmPlaceholder: texts.confirmPlaceholder,
              doTransfer: texts.doTransfer,
              transferring: texts.transferring,
              close: texts.close,
            }}
            onClose={() => setShowTransfer(false)}
          />
        </ModalPortal>
      )}
    </>
  );
}
