// Função "hub-campanhas" do Candeia CRM: resultado por campanha e por variante para o Hub.
// Junta o gasto (tabela gastos_campanha, vinda do Meta Ads) com os eventos do CRM que
// chegaram com utm_campaign / utm_content (função campanhas_resumo).
// Deploy com verify_jwt = false: o login é conferido em auth.ts (token do Firebase).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { cors, exigirAdmin, json } from "./auth.ts";

const DIAS_OK = new Set([7, 14, 30, 60, 90]);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "GET") return json({ erro: "método não permitido" }, 405, origin);

  const admin = await exigirAdmin(req);
  if (admin instanceof Response) return admin;

  const dias = Number(new URL(req.url).searchParams.get("dias") || 30);
  if (!DIAS_OK.has(dias)) return json({ erro: "período inválido" }, 400, origin);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const [linhas, ultimo] = await Promise.all([
    sb.rpc("campanhas_resumo", { p_dias: dias }),
    sb.from("gastos_campanha").select("dia,atualizado_em").order("dia", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (linhas.error) {
    console.error("hub-campanhas", linhas.error);
    return json({ erro: "falha ao ler o CRM" }, 500, origin);
  }
  return json({
    dias,
    gerado_em: new Date().toISOString(),
    gasto_ate: ultimo.data?.dia || null,
    linhas: linhas.data,
  }, 200, origin);
});
