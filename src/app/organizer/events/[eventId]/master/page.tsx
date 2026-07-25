import { redirect } from "next/navigation";

export default async function AdminEventMasterRedirect({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/admin?eventId=${encodeURIComponent(eventId)}`);
}
