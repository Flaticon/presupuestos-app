import type { APIRoute } from "astro";

const VALID_KEYS = new Set([
  "budget", "insumos", "projects", "active_project", "floors",
  "vigas", "losa", "losa-maciza", "escalera", "columnas", "muros",
]);

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key!;
  if (!VALID_KEYS.has(key)) {
    return new Response(JSON.stringify({ error: "Invalid key" }), { status: 400 });
  }

  const db = (locals as App.Locals).runtime.env.DB;
  const row = await db.prepare("SELECT value FROM app_data WHERE key = ?").bind(key).first<{ value: string }>();

  if (!row) {
    return new Response("null", {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(row.value, {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const key = params.key!;
  if (!VALID_KEYS.has(key)) {
    return new Response(JSON.stringify({ error: "Invalid key" }), { status: 400 });
  }

  const body = await request.text();

  const db = (locals as App.Locals).runtime.env.DB;
  await db
    .prepare(
      `INSERT INTO app_data (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .bind(key, body)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
