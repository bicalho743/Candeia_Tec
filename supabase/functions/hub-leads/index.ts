// Função "hub-leads" do Candeia CRM (Supabase, projeto zottntimhhsgwsgtvguz).
// Entrega a lista de leads para a tela "Leads" do Hub (candeiatec.com.br/hub).
//
// Segurança: o Hub faz login com o Google pelo Firebase (projeto corujalabs-hub).
// Esta função confere no servidor o token do Firebase (assinatura do Google,
// projeto, validade, e-mail verificado) e só responde para os e-mails da lista.
// Os dados do CRM saem daqui com a chave de serviço, que fica só no Supabase.
// Deploy com verify_jwt = false, porque o token é do Firebase, não do Supabase.

import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const FIREBASE_PROJECT = "corujalabs-hub";
const PERMITIDOS = new Set([
  "candeiatec.app@gmail.com",
  "corujalabs.dev@gmail.com",
  "solanobicalho@gmail.com",
]);
const ORIGENS = new Set([
  "https://candeiatec.com.br",
  "https://www.candeiatec.com.br",
  "https://bicalho743.github.io",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

function cors(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Vary": "Origin",
  };
  if (origin && ORIGENS.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "GET") return json({ erro: "método não permitido" }, 405, origin);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ erro: "sem login" }, 401, origin);

  let email = "";
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT}`,
      audience: FIREBASE_PROJECT,
    });
    if (payload.email_verified !== true) throw new Error("e-mail não verificado");
    email = String(payload.email || "").toLowerCase();
  } catch (_e) {
    return json({ erro: "login inválido ou vencido" }, 401, origin);
  }
  if (!PERMITIDOS.has(email)) return json({ erro: "acesso restrito" }, 403, origin);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const [leads, eventos] = await Promise.all([
    sb.from("vw_leads")
      .select("id,nome,telefone,email,marcas,origem,etapa,tags,whatsapp_optin,nao_perturbe,responsavel,criado_em,ultimo_contato_em,ultimo_evento,ultimo_produto,ultimo_evento_em,tarefas_abertas,total_comprado")
      .order("ultimo_evento_em", { ascending: false, nullsFirst: false })
      .limit(1000),
    sb.from("eventos")
      .select("contato_id,marca_id,tipo,fonte,produto_nome,valor,ocorreu_em")
      .order("ocorreu_em", { ascending: false })
      .limit(30),
  ]);
  if (leads.error || eventos.error) {
    console.error("hub-leads", leads.error || eventos.error);
    return json({ erro: "falha ao ler o CRM" }, 500, origin);
  }
  return json({ gerado_em: new Date().toISOString(), leads: leads.data, eventos: eventos.data }, 200, origin);
});
