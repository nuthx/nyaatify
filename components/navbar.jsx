"use client";

import Link from "next/link";
import { toast } from "sonner"
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { handleRequest } from "@/lib/handlers";
import { Logo } from "@/components/icons/logo";

export function NavBar() {
  const logoutApi = "/api/auth/logout";

  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const handleLogout = async () => {
    const result = await handleRequest("DELETE", logoutApi);
    if (result.success) {
      router.push("/login");
      router.refresh();
    } else {
      toast.error(t(`toast.failed.logout`), {
        description: result.message,
      });
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold">Nyaatify</span>
        </Link>

        <div className="flex items-center space-x-8">
          <Link href="/anime" className={`text-sm transition-all hover:text-primary ${pathname === "/anime" ? "text-primary" : "text-primary/50"}`}>
            {t("nav.anime")}
          </Link>
          <Link href="/download" className={`text-sm transition-all hover:text-primary ${pathname === "/download" ? "text-primary" : "text-primary/50"}`}>
            {t("nav.download")}
          </Link>
          <Link href="/settings/general" className={`text-sm text-sm transition-all hover:text-primary ${pathname.startsWith("/settings") ? "text-primary" : "text-primary/50"}`}>
            {t("nav.settings")}
          </Link>
          {pathname !== "/login" && (
            <button onClick={handleLogout} className="text-sm text-sm transition-all hover:text-primary text-primary/50">
              {t("glb.logout")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
