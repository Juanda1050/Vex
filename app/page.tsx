import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <AppShell
      title="Overview"
      description="Semantic tokens now drive the base application surface for a cleaner, higher-contrast UX."
      sidebar={
        <div className="grid gap-2">
          <Badge variant="secondary">Todos</Badge>
          <Badge variant="success">{todos?.length ?? 0} synced</Badge>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Todos</CardTitle>
          <CardDescription>
            Current items from Supabase rendered inside the new responsive
            shell.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3">
            {todos?.map((todo) => (
              <li
                key={todo.id}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm"
              >
                {todo.name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}
