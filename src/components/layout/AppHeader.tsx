import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1 flex items-center gap-2">
        <img 
          src="/logo-uplink.png" 
          alt="Uplink Logo" 
          className="h-8 w-8"
        />
        <h1 className="text-lg font-semibold">Uplink</h1>
      </div>
      <UserMenu />
    </header>
  );
}
