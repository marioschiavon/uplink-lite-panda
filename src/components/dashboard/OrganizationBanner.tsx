import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2 } from "lucide-react";

interface OrganizationBannerProps {
  name: string;
  isLegacy: boolean;
  plan?: string;
  sessionCount: number;
  sessionLimit: number;
}

export function OrganizationBanner({
  name,
  isLegacy,
  plan,
  sessionCount,
  sessionLimit,
}: OrganizationBannerProps) {
  const usagePercent = sessionLimit ? (sessionCount / sessionLimit) * 100 : 0;

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {name.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{name}</h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary">
                  <Building2 className="h-3 w-3 mr-1" />
                  {isLegacy ? "Cliente Legacy" : "Cliente Novo"}
                </Badge>
                {plan && (
                  <Badge variant="outline">
                    Plano {plan}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-right w-full md:w-auto">
            <div className="text-3xl font-bold">{sessionCount}</div>
            <div className="text-sm text-muted-foreground">
              de {sessionLimit || "∞"} sessões
            </div>
            {sessionLimit > 0 && (
              <Progress value={usagePercent} className="w-32 mt-2 ml-auto" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
