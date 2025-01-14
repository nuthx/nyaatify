"use client";

import useSWR from "swr"
import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next";
import { handlePost } from "@/lib/handlers";
import { CSS } from "@dnd-kit/utilities";
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
  const configApi = "/api/config";

  const { t, i18n } = useTranslation();
  const { toast } = useToast();
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

  const { data, error, isLoading, mutate } = useSWR(configApi, async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    return data;
  });

  useEffect(() => {
    // Check data?.title_priority to avoid error when drag finished
    if (data?.title_priority) {
      setItems(data.title_priority.split(",").map(id => ({ id, name: t(`lang.${id}`) })));
    }
    if (error) {
      toast({
        title: t("toast.failed.fetch_config"),
        description: error.message,
        variant: "destructive"
      });
    }
  }, [data, error, t]);

  const handleSaveConfig = async (values) => {
    const result = await handlePost(configApi, JSON.stringify(values));
    if (result.state === "success") {
      toast({
        title: t("toast.success.save")
      });
      mutate(configApi);
    } else {
      toast({
        title: t("toast.failed.save"),
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const newItems = arrayMove(items,
          items.findIndex(item => item.id === active.id),
          items.findIndex(item => item.id === over.id)
        );
        handleSaveConfig({ 
          title_priority: newItems.map(item => item.id).join(",")
        });
        return newItems;
      });
    }
  }

  if (isLoading) {
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
            <SelectTrigger className="w-72">
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
          <Select defaultValue={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-72">
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
          <CardTitle>{t("st.gr.sv_state.title")}</CardTitle>
          <CardDescription>{t("st.gr.sv_state.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={data?.show_server_state || "1"} onValueChange={(value) => handleSaveConfig({ show_server_state: value })}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t("glb.show")}</SelectItem>
              <SelectItem value="0">{t("glb.hide")}</SelectItem>
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
    <div className="flex items-center justify-between h-10 pr-0.5 pl-3 py-2 w-72 text-sm border rounded-md shadow-sm" ref={setNodeRef} style={style}>
      {item.name}
      <Button variant="ghost" size="icon" className="cursor-grab hover:cursor-grabbing hover:bg-transparent" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}
