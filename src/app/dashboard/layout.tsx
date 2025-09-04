
import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Briefcase, FileText, Files, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                        <FileText />
                        Optimizar CV
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                 <SidebarMenuButton asChild>
                    <Link href="/dashboard/cvs">
                        <Files />
                        Mis CVs
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton asChild>
                    <Link href="/dashboard/profile">
                        <User />
                        CV Online
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <SidebarMenuButton asChild>
                    <Link href="/dashboard/jobs">
                        <Briefcase />
                        Listado de Empleos
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="relative flex min-h-screen flex-col items-center p-4 bg-lava-lamp">
          <div className="absolute top-4 left-4 z-20 md:hidden">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
