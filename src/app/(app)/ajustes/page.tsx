export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings, listStages } from "@/lib/queries";
import { SettingsForm } from "@/components/settings-form";
import { StagesManager } from "@/components/stages-manager";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoUpload } from "@/components/logo-upload";

export default function SettingsPage() {
  const settings = getSettings();
  const stages = listStages();

  return (
    <div className="space-y-6 animate-in-fade">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Ajustes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personaliza tu CRM con los datos y la identidad de tu negocio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Negocio e identidad</CardTitle>
          <CardDescription>
            Nombre, moneda y color de marca. Los cambios se reflejan en toda la
            app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo del negocio</CardTitle>
          <CardDescription>
            Reemplaza la letra del sidebar con el logo de tu marca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload
            logoPath={settings.logo_path}
            businessName={settings.business_name}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>
            Elige entre modo claro, oscuro o el que use tu sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card id="etapas">
        <CardHeader>
          <CardTitle>Etapas del pipeline</CardTitle>
          <CardDescription>
            Agrega, edita o reordena las etapas de tu proceso de venta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StagesManager stages={stages} />
        </CardContent>
      </Card>
    </div>
  );
}
