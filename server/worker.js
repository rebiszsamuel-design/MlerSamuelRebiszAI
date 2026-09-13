const json = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    }
  });
};

const hashPassword = async (password) => {
  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        }
      });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      const result = await env.mullar_db
        .prepare("SELECT COUNT(*) AS count FROM users")
        .first();

      return json({
        ok: true,
        message: "Mullar API działa!",
        database: "D1 działa!",
        users: result.count
      });
    }

    if (request.method === "POST" && url.pathname === "/api/register") {
      try {
        const body = await request.json();

        const username = String(body.username || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!username || !email || !password) {
          return json({
            ok: false,
            error: "Wszystkie pola są wymagane."
          }, 400);
        }

        if (username.length < 3 || username.length > 30) {
          return json({
            ok: false,
            error: "Nazwa użytkownika musi mieć od 3 do 30 znaków."
          }, 400);
        }

        if (password.length < 6) {
          return json({
            ok: false,
            error: "Hasło musi mieć co najmniej 6 znaków."
          }, 400);
        }

        const existing = await env.mullar_db
          .prepare(
            "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
          )
          .bind(username, email)
          .first();

        if (existing) {
          return json({
            ok: false,
            error: "Użytkownik o tej nazwie lub adresie e-mail już istnieje."
          }, 409);
        }

        const passwordHash = await hashPassword(password);

        const result = await env.mullar_db
          .prepare(`
            INSERT INTO users (
              username,
              email,
              password,
              plan
            )
            VALUES (?, ?, ?, 'free')
          `)
          .bind(username, email, passwordHash)
          .run();

        return json({
          ok: true,
          message: "Konto zostało utworzone.",
          userId: result.meta.last_row_id
        }, 201);

      } catch (error) {
        return json({
          ok: false,
          error: "Nie udało się utworzyć konta.",
          details: error.message
        }, 500);
      }
    }

    return json({
      ok: false,
      error: "Nie znaleziono endpointu."
    }, 404);
  }
};