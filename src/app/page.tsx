import { redirect } from "next/navigation";
import { getAuthorizedSession } from "@/lib/auth";
import { BoardView } from "@/components/BoardView";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await getAuthorizedSession())) redirect("/login");
  return <BoardView />;
}
