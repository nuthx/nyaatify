"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

export function ListCard({ items, empty, content, state, menu, deleteable, deleteDesc, onDelete }) {
  const { t } = useTranslation();
  const [itemToDelete, setItemToDelete] = useState(null);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return items.map((item) => (
    <div key={item.id} className="flex items-center justify-between gap-2 px-6 py-4 border-b last:border-none">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h5 className="font-medium">{item.name}</h5>
            <Badge variant="outline">{item.type}</Badge>
          </div>
          {content(item)}
        </div>
        <p className="text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-md whitespace-nowrap">
          {state(item)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0"><Ellipsis className="text-muted-foreground" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {menu(item)}
          <DropdownMenuItem className="text-destructive" disabled={!deleteable(item)} onClick={() => setItemToDelete(item)}>
            <Trash2 />{t("glb.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={itemToDelete?.id === item.id} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("glb.confirm_delete")} {item.name}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("glb.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(item); setItemToDelete(null); }}>
              {t("glb.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ));
}