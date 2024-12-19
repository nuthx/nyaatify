"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Version</CardTitle>
          <CardDescription>This is the version of Nyaatify. You can check the latest version on GitHub.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <p>Version: 0.0.1</p>
          <p>Latest version: 0.0.1</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version</CardTitle>
          <CardDescription>This is the version of Nyaatify. You can check the latest version on GitHub.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <p>Version: 0.0.1</p>
          <p>Latest version: 0.0.1</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version</CardTitle>
          <CardDescription>This is the version of Nyaatify. You can check the latest version on GitHub.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <p>Version: 0.0.1</p>
          <p>Latest version: 0.0.1</p>
        </CardContent>
      </Card>
    </>
  )
}
