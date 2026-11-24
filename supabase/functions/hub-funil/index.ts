// Função "hub-funil" do Candeia CRM: funil de vendas do Planner Organiza para o Hub.
// O CRM NÃO acessa o banco do Planner. Esta função chama o endereço só de leitura
// GET https://plannerorganiza-api.onrender.com/admin/funil?dias=N com o cabeçalho
// X-Funil-Chave (segredo PLANNER_FUNIL_CHAVE, guardado só nos Secrets do Supabase).
// Guarda a resposta por 10 minutos na tabela cache_externo (o Render pode demorar a acordar).
// Deploy com verify_jwt = false: o login é conferido em auth.ts (token do Firebase).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { cors, exigirAdmin, json } from "./auth.ts";

const PLANNER_URL = "https://plannerorganiza-api.onrender.com/admin/funil";
const DIAS_OK = new Set([7, 14, 30, 60]);
const CACHE_MS = 10 * 60 * 1000;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "GET") return json({ erro: "método não permitido" }, 405, origin);

  const admin = await exigirAdmin(req);
  if (admin instanceof Response) return admin;

  const url = new URL(req.url);
  const dias = Number(url.searchParams.get("dias") || 30);
  if (!DIAS_OK.has(dias)) return json({ erro: "período inválido (7, 14, 30 ou 60)" }, 400, origin);
  const forcar = url.searchParams.get("atualizar") === "1";

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const chaveCache = `planner_funil_${dias}`;
  const { data: cache } = await sb.from("cache_externo").select("dados,atualizado_em").eq("chave", chaveCache).maybeSingle();
  const idade = cache ? Date.now() - new Date(cache.atualizado_em).getTime() : Infinity;
  if (cache && idade < CACHE_MS && !forcar) {
    return json({ ...cache.dados, _cache: { em: cache.atualizado_em, fresco: true } }, 200, origin);
  }

  const segredo = Deno.env.get("PLANNER_FUNIL_CHAVE");
  if (!segredo) {
    if (cache) return json({ ...cache.dados, _cache: { em: cache.atualizado_em, fresco: false, aviso: "chave do Planner não configurada" } }, 200, origin);
    return json({ erro: "A chave do Planner (PLANNER_FUNIL_CHAVE) ainda não foi salva no Supabase." }, 503, origin);
  }

  try {
    const r = await fetch(`${PLANNER_URL}?dias=${dias}`, {
      headers: { "X-Funil-Chave": segredo, "Accept": "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
    if (!r.ok) throw new Error(`Planner respondeu ${r.status}`);
    const dados = await r.json();
    await sb.from("cache_externo").upsert({ chave: chaveCache, dados, atualizado_em: new Date().toISOString() });
    return json({ ...dados, _cache: { em: new Date().toISOString(), fresco: true } }, 200, origin);
  } catch (e) {
    console.error("hub-funil", String(e));
    if (cache) {
      return json({ ...cache.dados, _cache: { em: cache.atualizado_em, fresco: false, aviso: "Planner não respondeu; mostrando a última leitura" } }, 200, origin);
    }
    return json({ erro: "O Planner não respondeu (pode estar acordando). Tente de novo em 1 minuto." }, 502, origin);
  }
});
