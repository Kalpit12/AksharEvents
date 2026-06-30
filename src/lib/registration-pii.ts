import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import type { TeamMember } from "@/components/exhibitor-portal/types";

export function redactTeamMemberForClient(member: TeamMember): TeamMember {
  const { passportNumber, ...rest } = member;
  return {
    ...rest,
    hasPassportNumber: Boolean(passportNumber?.trim()),
  };
}

export function redactRegistrationForClient(
  data: SavedRegistrationData | null
): SavedRegistrationData | null {
  if (!data) return null;
  return {
    ...data,
    members: Array.isArray(data.members)
      ? data.members.map(redactTeamMemberForClient)
      : data.members,
  };
}
