import { listClosedClients } from "@/lib/queries";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const clients = listClosedClients();

  const headers = [
    "Nombre",
    "Teléfono",
    "Email",
    "Instagram",
    "Fuente",
    "Etapa",
    "Producto/Servicio",
    "Monto",
    "Moneda",
    "Método de pago",
    "Fecha de cierre",
    "Notas de pago",
    "Creado",
  ];

  const rows = clients.map((c) => [
    c.name,
    c.phone,
    c.email,
    c.instagram,
    c.source,
    c.stage_name,
    c.payment?.service,
    c.payment?.amount,
    c.payment?.currency,
    c.payment?.method,
    c.payment?.paid_at,
    c.payment?.notes,
    c.created_at,
  ]);

  const csv =
    "﻿" +
    [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-cerrados-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
