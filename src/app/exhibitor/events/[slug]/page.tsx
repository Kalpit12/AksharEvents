import { redirect } from "next/navigation";

export default async function ExhibitorEventSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  redirect("/exhibitor");
}
