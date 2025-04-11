import Image from "next/image";
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next";

export function NyaatifyInfo({ className }) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Image src="/icons/logo.png" alt="Nyaatify Logo" width={72} height={72} draggable="false"/>
      <h1 className="text-2xl font-bold">Nyaatify</h1>
      <p className="text-sm text-muted-foreground">{t("st.abt.description")}</p>
    </div>
  );
}
