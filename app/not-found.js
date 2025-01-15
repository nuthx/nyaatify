"use client";

import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] gap-12">
      <Image src="/404.png" alt="404 page not found" className="dark:grayscale dark:invert dark:opacity-90" width={280} height={280} priority />
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-4xl font-bold">{t("404.title")}</h2>
        <p className="text-muted-foreground">{t("404.description")}</p>
      </div>
      <Button asChild>
        <Link href="/">{t("404.home")}</Link>
      </Button>
    </div>
  )
}
