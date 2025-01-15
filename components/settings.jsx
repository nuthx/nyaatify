"use client";

import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ellipsis, Trash2 } from "lucide-react";

export function Nav({ label, path }) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <button
      className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-primary/5 dark:hover:bg-muted/60 ${pathname === path ? "bg-primary/5 dark:bg-muted/80" : ""}`}
      onClick={() => router.push(path)}
    >
      {label}
    </button>
  );
}

export function ListCard({ items, empty, content, state, menu, onDelete, deleteable, deleteDescription }) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return items.map((item) => (
    <div key={item.id} className="flex items-center justify-between px-6 py-4 border-b last:border-none">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h5 className="font-medium">{item.name}</h5>
          <Badge variant="outline">{item.type}</Badge>
        </div>
        {content(item)}
      </div>
      <div className="flex space-x-2 items-center">
        <p className="text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-md whitespace-nowrap">
          {state(item)}
        </p>
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Ellipsis /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {menu(item)}
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive" disabled={!deleteable(item)}><Trash2 />{t("glb.delete")}</DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("glb.confirm_delete")}</AlertDialogTitle>
              <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("glb.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(item)}>{t("glb.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  ));
}
