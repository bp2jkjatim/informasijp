import { redirect } from "next/navigation";
import { getCurrentUser, getUserHomePath } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getUserHomePath(user.role));
  }

  redirect("/login");
}
