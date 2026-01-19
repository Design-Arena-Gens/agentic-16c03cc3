# Shein Growth Hacker · Outlier Agent

Automatización end-to-end para detectar productos outliers en Shein (moda femenina) usando n8n, Supabase, Notion y Telegram. Incluye UI Next.js para visualizar resultados y blueprint del flujo n8n listo para importar.

## Componentes

- **Next.js 14** (`/app`): dashboard ejecutivo con consulta a Supabase.
- **n8n Workflow** (`n8n/workflows/shein-growth-hacker-outlier-agent.json`): orquestación de scraping, filtrado y reportes.
- **Supabase** (`supabase/schema.sql`): esquema para snapshots crudos y productos outliers.

## Variables de Entorno

### Next.js / API routes

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SCRAPING_PROVIDER=scrapingbee|zenrows
SCRAPING_API_KEY=
NOTION_TOKEN=
NOTION_DATABASE_ID=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
OPENAI_API_KEY=
NEXT_PUBLIC_BASE_URL=https://agentic-16c03cc3.vercel.app
```

### n8n Credenciales

| Servicio      | Credencial sugerida | Campos clave |
| ------------- | ------------------- | ------------ |
| Telegram      | `Telegram Bot`      | Token del bot y chat ID |
| OpenAI        | `OpenAI`            | API key (para Whisper y TTS) |
| ScrapingBee   | `HTTP Header Auth`  | `api_key`, `render_js`, proxies |
| ZenRows       | `HTTP Header Auth`  | `apikey`, `js_render`, `proxy_country` |
| Supabase REST | `HTTP Header Auth`  | `apikey`, `Authorization: Bearer <SRK>` |
| Notion        | `Notion`            | Token interno + Database ID |

## Estructura del Flujo n8n

1. **Entrada Telegram**: trigger de mensaje de voz → descarga del audio → transcripción con Whisper.
2. **Detección de categoría**: clasifica entre *Conjuntos de Alfaiataria* y *Vestidos de Verão*.
3. **Scraping Shein**: HTTP Request parametrizado para ScrapingBee/ZenRows con JavaScript rendering + proxies residenciales.
4. **Parser & Persistencia**: normaliza el payload de Shein, guarda snapshots crudos en Supabase.
5. **Filtro Outlier**: compara crecimiento de reviews vs histórico ≥20% o etiqueta *Hot Sale* con <100 reseñas.
6. **Activación**: inserta outliers en Supabase, genera página Notion con visuales/pricing y difunde resumen (texto + voz) vía Telegram.

Importa el JSON desde n8n (`Settings → Import Workflow`) y asigna las credenciales marcadas.

## Desarrollo Local

```bash
npm install
npm run dev
```

Define las variables en `.env.local`. El dashboard consulta `/api/outliers`, que espera tablas pobladas. Ejecuta el flujo n8n (o inserta datos manualmente) para visualizar resultados.

## Despliegue

1. Compila localmente: `npm run build`
2. Configura variables en Vercel (Dashboard o CLI `vercel env`)
3. Despliega: `vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-16c03cc3`
4. Verifica: `curl https://agentic-16c03cc3.vercel.app`

## Supabase

Ejecuta `supabase/schema.sql` en tu instancia (SQL Editor). Añade políticas RLS si expones endpoints públicos.

## Datos Clave

- Precio se normaliza a BRL (conversión 5.2 si viene en otra moneda).
- Selección enfocada al mercado de Brás (São Paulo) para validar saturación y tracción local.
- Reportes Notion listos para revisión ejecutiva en menos de 5 minutos desde el audio inicial.
