import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`);
  }
  return session.user as { id: string; email: string; name: string };
}

export async function getOptionalUser() {
  const session = await auth();
  return session?.user ?? null;
}
