import { Suspense } from "react";
import type { OutlierProduct } from "@/types/outlier";

async function fetchOutliers(): Promise<OutlierProduct[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/outliers`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return payload.items ?? [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

const OutlierTable = async () => {
  const items = await fetchOutliers();

  if (!items.length) {
    return (
      <div className="card">
        <h3>Sin detecciones recientes</h3>
        <p>
          Ejecuta el flujo en n8n para poblar Supabase y ver los productos disruptivos en
          esta vista.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2>Últimos Outliers</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio (R$)</th>
            <th>Reviews</th>
            <th>Δ Semanal</th>
            <th>Justificación</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product.id}>
              <td>
                <a href={product.productUrl} target="_blank" rel="noreferrer">
                  {product.title}
                </a>
              </td>
              <td>{product.priceBrl.toFixed(2)}</td>
              <td>{product.reviewCount}</td>
              <td>{product.reviewGrowthWeekly.toFixed(1)}%</td>
              <td>{product.justification}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default function Page() {
  return (
    <main>
      <header>
        <span className="badge">Shein Growth Hacker · Outlier Agent</span>
        <h1>Pipeline Operacional</h1>
        <p>
          Flujo end-to-end diseñado en n8n para detectar productos con crecimiento anómalo
          en moda femenina (Conjuntos de Alfaiataria y Vestidos de Verão) utilizando
          ScrapingBee/ZenRows, Supabase, Notion y Telegram.
        </p>
      </header>

      <section>
        <h2>Arquitectura</h2>
        <div className="grid two">
          <div className="card">
            <h3>Entrada · Telegram</h3>
            <p>
              Recepción de notas de voz en canal operativo. n8n descarga el audio y usa
              Whisper para transcribir keywords y detectar la categoría objetivo.
            </p>
          </div>
          <div className="card">
            <h3>Scraping Sigiloso</h3>
            <p>
              ScrapingBee o ZenRows con proxies residenciales premium y renderizado
              JavaScript. API Key administrada por credenciales seguras en n8n.
            </p>
          </div>
          <div className="card">
            <h3>Persistencia Supabase</h3>
            <p>
              Almacenamiento histórico en tablas `shein_raw_snapshots` y
              `shein_outliers` para análisis longitudinal desde el dashboard de este
              proyecto o via SQL.
            </p>
          </div>
          <div className="card">
            <h3>Activación Ejecutiva</h3>
            <p>
              Notion recibe un reporte con la selección final de productos junto con
              imágenes, precios en BRL y racional estratégico. Resumen ejecutivo enviado a
              Telegram (texto + voz).
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>Variables Clave</h2>
        <ul>
          <li><code>SCRAPING_PROVIDER</code> · `scrapingbee` o `zenrows`</li>
          <li><code>SCRAPING_API_KEY</code> · acceso al proveedor de scraping</li>
          <li><code>SUPABASE_SERVICE_ROLE_KEY</code> · inserciones server-side</li>
          <li><code>NOTION_DATABASE_ID</code> · destino del informe ejecutivo</li>
          <li><code>TELEGRAM_CHAT_ID</code> · canal para feedback</li>
        </ul>
      </section>

      <Suspense fallback={<div className="card">Cargando outliers…</div>}>
        <OutlierTable />
      </Suspense>

      <footer>
        Optimizado para inteligencia competitiva del mercado de Brás (São Paulo).
      </footer>
    </main>
  );
}
