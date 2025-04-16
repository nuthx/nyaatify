"use client";

import { toast } from "sonner"
import { useEffect, useState } from "react";
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
import {
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  const [items, setItems] = useState([
    { id: "jp", name: t("lang.jp") },
    { id: "en", name: t("lang.en") },
    { id: "romaji", name: t("lang.romaji") },
    { id: "cn", name: t("lang.cn") }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const { data: configData, isLoading: configLoading, mutate: mutateConfig } = useData(API.CONFIG, t("toast.failed.fetch_config"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.general")} - Nyaatify`;
  }, [t]);

  // Check configData?.animeTitlePriority to avoid error when drag finished
  useEffect(() => {
    if (configData?.animeTitlePriority) {
      setItems(configData.animeTitlePriority.split(",").map(id => ({ id, name: t(`lang.${id}`) })));
    }
  }, [configData, t]);

  const handleSaveConfig = async (values) => {
    const result = await handleRequest("PATCH", API.CONFIG, values, t("toast.failed.save"));
    if (result) {
      toast(t("toast.success.save"));
      mutateConfig();
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Calculate new sort result then update
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      
      // Save title priority after drag finished
      handleSaveConfig({ 
        animeTitlePriority: newItems.map(item => item.id).join(",")
      });
    }
  }

  if (configLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.theme.title")}</CardTitle>
          <CardDescription>{t("st.gr.theme.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-full lg:w-72 transition-width duration-300 ease-in-out">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("st.gr.theme.system")}</SelectItem>
              <SelectItem value="light">{t("st.gr.theme.light")}</SelectItem>
              <SelectItem value="dark">{t("st.gr.theme.dark")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.language.title")}</CardTitle>
          <CardDescription>{t("st.gr.language.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={i18n.resolvedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full lg:w-72 transition-width duration-300 ease-in-out">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">简体中文</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.title_priority.title")}</CardTitle>
          <CardDescription>{t("st.gr.title_priority.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map(item => <SortableItem key={item.id} item={item} />)}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.cover_source.title")}</CardTitle>
          <CardDescription>{t("st.gr.cover_source.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={configData?.animeCoverSource || "bangumi"} onValueChange={(value) => handleSaveConfig({ animeCoverSource: value })}>
            <SelectTrigger className="w-full lg:w-72 transition-width duration-300 ease-in-out">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anilist">Anilist</SelectItem>
              <SelectItem value="bangumi">Bangumi</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  )
}

function SortableItem({ item }) {
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
    <div className="flex items-center justify-between h-10 pr-0.5 pl-3 py-2 w-full lg:w-72 text-sm border rounded-md shadow-sm" ref={setNodeRef} style={style}>
      {item.name}
      <Button variant="ghost" size="icon" className="cursor-grab hover:cursor-grabbing hover:bg-transparent" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}
