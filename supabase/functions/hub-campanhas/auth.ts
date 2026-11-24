// Login do Hub (Google pelo Firebase, projeto corujalabs-hub), conferido no servidor.
// Cópia igual em cada função hub-* (o deploy de cada função leva só a própria pasta).
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const FIREBASE_PROJECT = "corujalabs-hub";
export const PERMITIDOS = new Set([
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

export function cors(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Vary": "Origin",
  };
  if (origin && ORIGENS.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

export function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/** Devolve o e-mail do administrador, ou uma Response de erro. */
export async function exigirAdmin(req: Request): Promise<string | Response> {
  const origin = req.headers.get("origin");
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ erro: "sem login" }, 401, origin);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT}`,
      audience: FIREBASE_PROJECT,
    });
    if (payload.email_verified !== true) throw new Error("e-mail não verificado");
    const email = String(payload.email || "").toLowerCase();
    if (!PERMITIDOS.has(email)) return json({ erro: "acesso restrito" }, 403, origin);
    return email;
  } catch (_e) {
    return json({ erro: "login inválido ou vencido" }, 401, origin);
  }
}
