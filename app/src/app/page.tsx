import { redirect } from "next/navigation";
import { getCurrentUser, getUserHomePath } from "@/lib/auth";
import { appPath } from "@/lib/paths";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getUserHomePath(user.role));
  }

  redirect(appPath("/login"));
}
