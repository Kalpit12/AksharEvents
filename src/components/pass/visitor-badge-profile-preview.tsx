"use client";

import ProfileCard from "@/components/profile-card/ProfileCard";
import { EventVisitorBadge, type EventBadgeProps } from "@/components/pass/digital-pass-card";

const BADGE_INNER_GRADIENT = "linear-gradient(145deg, rgba(28, 26, 23, 0.45) 0%, rgba(197, 168, 128, 0.28) 100%)";

type VisitorBadgeProfilePreviewProps = Omit<EventBadgeProps, "preview"> & {
  preview?: true;
};

/** Live registration preview — ProfileCard tilt, glow, and holo overlay on the visitor badge. */
export function VisitorBadgeProfilePreview(props: VisitorBadgeProfilePreviewProps) {
  return (
    <ProfileCard
      className="pc-card-wrapper--badge"
      cardClassName="pc-card--badge"
      showUserInfo={false}
      enableTilt
      behindGlowEnabled
      innerGradient={BADGE_INNER_GRADIENT}
      behindGlowColor="rgba(197, 168, 128, 0.55)"
      behindGlowSize="55%"
    >
      <EventVisitorBadge {...props} preview embedded />
    </ProfileCard>
  );
}
