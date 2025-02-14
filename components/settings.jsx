"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Ellipsis, Trash2, GripVertical } from "lucide-react";

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

export function ListCard({ items, empty, content, state, menu, deleteable, deleteDesc, onDelete }) {
  const { t } = useTranslation();
  const [openAlert, setopenAlert] = useState(false);

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><Ellipsis /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {menu(item)}
            <DropdownMenuItem className="text-destructive" disabled={deleteable(item)} onClick={() => setopenAlert(true)}>
              <Trash2 />{t("glb.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={openAlert} onOpenChange={setopenAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("glb.confirm_delete")}</AlertDialogTitle>
              <AlertDialogDescription>{deleteDesc}</AlertDialogDescription>
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

export function SortableItem({ item }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="flex items-center justify-between h-10 pr-0.5 pl-3 py-2 w-72 text-sm border rounded-md shadow-sm" ref={setNodeRef} style={style}>
      {item.name}
      <Button variant="ghost" size="icon" className="cursor-grab hover:cursor-grabbing hover:bg-transparent" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}
