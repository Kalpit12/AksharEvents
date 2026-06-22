import { redirect } from "next/navigation";

export default function AdminEventMasterRedirect({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  redirect("/admin");
}
