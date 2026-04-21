# CRM Local

> CRM moderno y 100% local para pequeños y medianos negocios. Tus datos viven en un archivo SQLite dentro de la carpeta del proyecto — nunca salen de tu computadora, no hay servidor externo, no hay cuotas.

---

## Qué es esto

Un CRM completo que corre en `localhost`, pensado para **equipos pequeños que no quieren pagar Salesforce, HubSpot o Pipedrive** y que prefieren tener sus datos en su propio equipo.

**Features principales:**

- 📋 **Pipeline kanban** con etapas personalizables y drag & drop
- 👥 **Contactos** con teléfono, email, Instagram, fuente y notas
- 💰 **Clientes cerrados** con método de pago, producto/servicio, fecha y exportación CSV
- 📝 **Historial de notas** por contacto con timestamp automático
- 🔔 **Alertas de seguimiento** — leads sin contactar en 1 / 3 / 7 días
- 📊 **Dashboard** con métricas: total vendido, clientes activos, tasa de cierre, leads por fuente
- 📈 **Analítica avanzada** — velocidad de pipeline, embudo de conversión, revenue proyectado, leads estancados
- 💬 **Integración WhatsApp** — click en el botón verde abre `wa.me` con el número del contacto
- 🎨 **Modo claro/oscuro** + color de marca personalizable (slider HSL)
- 🖼️ **Logo del negocio** — subida de imagen que reemplaza la inicial en el sidebar
- 🧙 **Wizard de primer uso** — configura nombre, moneda, color, logo y etapas en menos de un minuto
- 📱 **Responsive** — funciona en móvil, tablet y desktop
- 🔐 **Sin autenticación, sin cuenta, sin cloud** — todo queda en `data/crm.db`

---

## Requisitos

- **[Node.js](https://nodejs.org/) 20 o superior** (probado con 20.9+, 22.x y 25.x)
- macOS, Linux o Windows
- ~400 MB de espacio en disco (node_modules + build)

---

## Instalación (3 pasos)

```bash
# 1. Clona el repo
git clone https://github.com/JavierHernandeztop/crm-local.git
cd crm-local

# 2. Instala dependencias
npm install

# 3. Arranca en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La primera vez verás el **wizard de bienvenida** — configura tu negocio en 5 pasos (nombre, moneda, color, logo y etapas) y listo.

### Uso en producción (local)

```bash
npm run build    # compila
npm run start    # launcher inteligente: sirve y abre el navegador
```

### Distribución a clientes no técnicos

Genera un zip auto-instalable:

```bash
npm run package
```

Produce `dist/crm-local-v*.zip`. El cliente solo descomprime y hace doble click en `Iniciar CRM.command` (macOS) o `Iniciar CRM.bat` (Windows) — el launcher se encarga de instalar, compilar y abrir el navegador. Guía para ellos dentro del zip: `LEEME.txt`.

---

## Configuración

Toda la configuración vive en la UI (**Ajustes**). No hay variables de entorno obligatorias. Las opcionales están documentadas en [`.env.example`](./.env.example).

**Respaldo de datos:** copia el archivo `data/crm.db`. Para restaurar, reemplázalo con tu copia. Para mudar de computadora, copia la carpeta completa (incluyendo `data/`).

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19.2, TypeScript 5, Tailwind v4 |
| Componentes | Radix UI primitives (estilo shadcn-custom) |
| Estado/datos | Server Components + Server Actions |
| Base de datos | SQLite via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (síncrono, un archivo) |
| Drag & drop | [`@dnd-kit`](https://dndkit.com/) |
| Animaciones | [`motion`](https://motion.dev/) (framer-motion) |
| Gráficos | [`recharts`](https://recharts.org/) |
| Iconos | [`lucide-react`](https://lucide.dev/) |
| Notificaciones | [`sonner`](https://sonner.emilkowal.ski/) |
| Validación | [`zod`](https://zod.dev/) |
| Theming | [`next-themes`](https://github.com/pacocoursey/next-themes) |

---

## Estructura

```
src/
├── app/
│   ├── layout.tsx            · root layout con theme + font
│   ├── (app)/                · rutas dentro del AppShell (sidebar + topbar)
│   │   ├── layout.tsx        · guard de onboarding + datos globales
│   │   ├── page.tsx          · dashboard
│   │   ├── pipeline/         · kanban con drag & drop
│   │   ├── contactos/        · lista + detalle con notas
│   │   ├── clientes/         · cerrados con export CSV
│   │   ├── analitica/        · velocidad, embudo, revenue, calidad
│   │   └── ajustes/          · identidad, logo, color, etapas, tema
│   ├── bienvenida/           · wizard de primer uso
│   └── api/export/clientes/  · endpoint CSV
├── components/               · UI, gráficos, forms
└── lib/
    ├── db.ts                 · SQLite singleton + migraciones
    ├── queries.ts            · lecturas
    ├── analytics.ts          · métricas y queries de analítica
    ├── notifications.ts      · sistema de alertas
    └── actions/              · server actions por módulo
```

---

## Migraciones

Las migraciones viven en `src/lib/db.ts`, en el array `MIGRATIONS`. Son idempotentes y se ejecutan al abrir la BD por primera vez. Para agregar una:

```ts
{ id: 5, sql: `ALTER TABLE contacts ADD COLUMN nueva_columna TEXT;` }
```

---

## Scripts

```bash
npm run dev        # desarrollo con hot reload
npm run build      # build de producción
npm run start      # launcher: sirve + abre navegador
npm run package    # genera zip distribuible en dist/
```

---

## Licencia

MIT © [Javier Hernandez](https://github.com/JavierHernandeztop) — ver [LICENSE](./LICENSE).

## Créditos

Construido con [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/) y [SQLite](https://sqlite.org/). Componentes UI inspirados en [shadcn/ui](https://ui.shadcn.com/) y construidos sobre [Radix UI](https://www.radix-ui.com/).

Iconos por [Lucide](https://lucide.dev/). Animaciones con [Motion](https://motion.dev/). Gráficos con [Recharts](https://recharts.org/).

---

<sub>¿Encontraste un bug o tienes una feature en mente? Abre un issue.</sub>
