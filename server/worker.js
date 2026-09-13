const ALLOWED_ORIGINS = new Set([
  "https://mullar.online",
  "https://www.mullar.online",
  "http://127.0.0.1:3000",
  "http://localhost:3000"
]);

function getCorsOrigin(request) {
  const origin = request.headers.get("Origin");

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return origin;
  }

  return "https://mullar.online";
}

function corsHeaders(request) {
  return {
    "Access-Control-Allow-Origin":
      getCorsOrigin(request),

    "Access-Control-Allow-Credentials":
      "true",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Admin-Key",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Vary":
      "Origin"
  };
}

function json(
  request,
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        ...corsHeaders(request)
      }
    }
  );
}

function getToken(request) {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization) {
    return null;
  }

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  return token || null;
}

async function hashPassword(password) {
  const encoder =
    new TextEncoder();

  const data =
    encoder.encode(password);

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hash)
  )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}

function createSessionToken() {
  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    plan: user.plan,
    plan_expires_at:
      user.plan_expires_at,
    bio: user.bio,
    discord: user.discord,
    github: user.github,
    instagram: user.instagram,
    avatar: user.avatar,
    banner: user.banner,
    created_at: user.created_at
  };
}

async function getUserFromRequest(
  request,
  env
) {
  const token =
    getToken(request);

  if (!token) {
    return null;
  }

  const user =
    await env.mullar_db
      .prepare(`
        SELECT
          users.id,
          users.username,
          users.email,
          users.plan,
          users.plan_expires_at,
          users.bio,
          users.discord,
          users.github,
          users.instagram,
          users.avatar,
          users.banner,
          users.created_at
        FROM sessions
        INNER JOIN users
          ON users.id = sessions.user_id
        WHERE sessions.token = ?
        LIMIT 1
      `)
      .bind(token)
      .first();

  return user || null;
}


// ========================================
// ACTIVATION CODE GENERATOR
// ========================================

function generateRandomCodePart() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const bytes =
    new Uint8Array(4);

  crypto.getRandomValues(bytes);

  let result = "";

  for (const byte of bytes) {
    result +=
      alphabet[
        byte % alphabet.length
      ];
  }

  return result;
}

function generateActivationCode(plan) {
  const prefix =
    plan === "pro"
      ? "MLR-PRO"
      : "MLR-PREM";

  return [
    prefix,
    generateRandomCodePart(),
    generateRandomCodePart(),
    generateRandomCodePart()
  ].join("-");
}


// ========================================
// WORKER
// ========================================

export default {

  async fetch(
    request,
    env
  ) {

    // ========================================
    // CORS
    // ========================================

    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers:
            corsHeaders(request)
        }
      );
    }


    const url =
      new URL(request.url);


    // ========================================
    // API STATUS
    // ========================================

    if (
      request.method === "GET" &&
      url.pathname === "/"
    ) {

      try {

        const result =
          await env.mullar_db
            .prepare(
              "SELECT COUNT(*) AS count FROM users"
            )
            .first();

        return json(
          request,
          {
            ok: true,

            message:
              "Mullar API działa!",

            database:
              "D1 działa!",

            users:
              result.count
          }
        );

      } catch (error) {

        return json(
          request,
          {
            ok: false,
            error:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // REGISTER
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/register"
    ) {

      try {

        const body =
          await request.json();

        const username =
          String(
            body.username || ""
          ).trim();

        const email =
          String(
            body.email || ""
          )
            .trim()
            .toLowerCase();

        const password =
          String(
            body.password || ""
          );


        if (
          !username ||
          !email ||
          !password
        ) {

          return json(
            request,
            {
              ok: false,
              error:
                "Wszystkie pola są wymagane."
            },
            400
          );
        }


        if (
          username.length < 3 ||
          username.length > 30
        ) {

          return json(
            request,
            {
              ok: false,
              error:
                "Nazwa użytkownika musi mieć od 3 do 30 znaków."
            },
            400
          );
        }


        if (
          !/^[a-zA-Z0-9_.-]+$/.test(
            username
          )
        ) {

          return json(
            request,
            {
              ok: false,
              error:
                "Nazwa użytkownika może zawierać tylko litery, cyfry, _, - i ."
            },
            400
          );
        }


        if (
          password.length < 6
        ) {

          return json(
            request,
            {
              ok: false,
              error:
                "Hasło musi mieć co najmniej 6 znaków."
            },
            400
          );
        }


        const existing =
          await env.mullar_db
            .prepare(`
              SELECT id
              FROM users
              WHERE username = ?
                 OR email = ?
              LIMIT 1
            `)
            .bind(
              username,
              email
            )
            .first();


        if (existing) {

          return json(
            request,
            {
              ok: false,
              error:
                "Użytkownik o tej nazwie lub adresie e-mail już istnieje."
            },
            409
          );
        }


        const passwordHash =
          await hashPassword(
            password
          );


        const result =
          await env.mullar_db
            .prepare(`
              INSERT INTO users (
                username,
                email,
                password,
                plan
              )
              VALUES (
                ?,
                ?,
                ?,
                'free'
              )
            `)
            .bind(
              username,
              email,
              passwordHash
            )
            .run();


        return json(
          request,
          {
            ok: true,

            message:
              "Konto zostało utworzone.",

            userId:
              result.meta.last_row_id
          },
          201
        );

      } catch (error) {

        return json(
          request,
          {
            ok: false,

            error:
              "Nie udało się utworzyć konta.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // LOGIN
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/login"
    ) {

      try {

        const body =
          await request.json();

        const login =
          String(
            body.login || ""
          ).trim();

        const password =
          String(
            body.password || ""
          );


        if (
          !login ||
          !password
        ) {

          return json(
            request,
            {
              ok: false,
              error:
                "Wpisz login i hasło."
            },
            400
          );
        }


        const user =
          await env.mullar_db
            .prepare(`
              SELECT *
              FROM users
              WHERE username = ?
                 OR email = ?
              LIMIT 1
            `)
            .bind(
              login,
              login.toLowerCase()
            )
            .first();


        if (!user) {

          return json(
            request,
            {
              ok: false,
              error:
                "Nieprawidłowy login lub hasło."
            },
            401
          );
        }


        const passwordHash =
          await hashPassword(
            password
          );


        if (
          passwordHash !==
          user.password
        ) {

          return json(
            request,
            {
              ok: false,
              error:
                "Nieprawidłowy login lub hasło."
            },
            401
          );
        }


        const token =
          createSessionToken();


        await env.mullar_db
          .prepare(`
            INSERT INTO sessions (
              token,
              user_id
            )
            VALUES (?, ?)
          `)
          .bind(
            token,
            user.id
          )
          .run();


        return json(
          request,
          {
            ok: true,

            message:
              "Zalogowano!",

            token,

            user:
              publicUser(user)
          }
        );

      } catch (error) {

        return json(
          request,
          {
            ok: false,

            error:
              "Nie udało się zalogować.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // CURRENT USER
    // ========================================

    if (
      request.method === "GET" &&
      url.pathname ===
        "/api/me"
    ) {

      try {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json(
            request,
            {
              ok: false,
              loggedIn: false
            },
            401
          );
        }


        return json(
          request,
          {
            ok: true,
            loggedIn: true,

            user:
              publicUser(user)
          }
        );

      } catch (error) {

        return json(
          request,
          {
            ok: false,
            error:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // PUBLIC PROFILE
    // ========================================

    if (
      request.method === "GET" &&
      url.pathname.startsWith(
        "/api/profile/"
      )
    ) {

      try {

        const profileUsername =
          decodeURIComponent(
            url.pathname.replace(
              "/api/profile/",
              ""
            )
          ).trim();


        if (!profileUsername) {

          return json(
            request,
            {
              success: false,

              message:
                "Brak użytkownika."
            },
            400
          );
        }


        const profile =
          await env.mullar_db
            .prepare(`
              SELECT
                id,
                username,
                plan,
                plan_expires_at,
                bio,
                discord,
                github,
                instagram,
                avatar,
                banner,
                created_at
              FROM users
              WHERE username = ?
              LIMIT 1
            `)
            .bind(
              profileUsername
            )
            .first();


        if (!profile) {

          return json(
            request,
            {
              success: false,

              message:
                "Nie znaleziono profilu."
            },
            404
          );
        }


        return json(
          request,
          {
            success: true,
            profile
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              "Nie udało się pobrać profilu.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // UPDATE PROFILE
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/profile/update"
    ) {

      try {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json(
            request,
            {
              success: false,

              message:
                "Musisz być zalogowany."
            },
            401
          );
        }


        const body =
          await request.json();


        const bio =
          String(
            body.bio || ""
          ).trim();

        const discord =
          String(
            body.discord || ""
          ).trim();

        const github =
          String(
            body.github || ""
          ).trim();

        const instagram =
          String(
            body.instagram || ""
          ).trim();


        if (bio.length > 500) {

          return json(
            request,
            {
              success: false,

              message:
                "Opis może mieć maksymalnie 500 znaków."
            },
            400
          );
        }


        await env.mullar_db
          .prepare(`
            UPDATE users
            SET
              bio = ?,
              discord = ?,
              github = ?,
              instagram = ?
            WHERE id = ?
          `)
          .bind(
            bio,
            discord,
            github,
            instagram,
            user.id
          )
          .run();


        return json(
          request,
          {
            success: true,

            message:
              "Profil został zapisany."
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              "Nie udało się zapisać profilu.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // REDEEM CODE
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/redeem-code"
    ) {

      try {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json(
            request,
            {
              success: false,

              message:
                "Musisz być zalogowany."
            },
            401
          );
        }


        const body =
          await request.json();

        const code =
          String(
            body.code || ""
          )
            .trim()
            .toUpperCase();


        if (!code) {

          return json(
            request,
            {
              success: false,

              message:
                "Wpisz kod aktywacyjny."
            },
            400
          );
        }


        const activation =
          await env.mullar_db
            .prepare(`
              SELECT *
              FROM activation_codes
              WHERE code = ?
              LIMIT 1
            `)
            .bind(code)
            .first();


        if (!activation) {

          return json(
            request,
            {
              success: false,

              message:
                "Nieprawidłowy kod aktywacyjny."
            },
            404
          );
        }


        if (
          Number(
            activation.redeemed
          ) === 1
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Ten kod został już wykorzystany."
            },
            409
          );
        }


        const plan =
          String(
            activation.plan || ""
          )
            .trim()
            .toLowerCase();


        let userPlan =
          "free";

        let expiresAt =
          null;


        if (
          plan === "premium"
        ) {

          userPlan =
            "premium";

        } else if (
          plan === "pro"
        ) {

          userPlan =
            "pro";

          const expiration =
            new Date();

          expiration.setDate(
            expiration.getDate() + 7
          );

          expiresAt =
            expiration.toISOString();

        } else {

          return json(
            request,
            {
              success: false,

              message:
                "Ten kod ma nieprawidłowy plan."
            },
            400
          );
        }


        // Najpierw próbujemy oznaczyć kod jako wykorzystany.
        // Dzięki WHERE redeemed = 0 dwa równoczesne żądania
        // nie powinny wykorzystać tego samego kodu.

        const redeemResult =
          await env.mullar_db
            .prepare(`
              UPDATE activation_codes
              SET
                redeemed = 1,
                redeemed_by = ?,
                redeemed_at = CURRENT_TIMESTAMP
              WHERE id = ?
                AND redeemed = 0
            `)
            .bind(
              user.id,
              activation.id
            )
            .run();


        if (
          Number(
            redeemResult.meta.changes
          ) !== 1
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Ten kod został już wykorzystany."
            },
            409
          );
        }


        try {

          await env.mullar_db
            .prepare(`
              UPDATE users
              SET
                plan = ?,
                plan_expires_at = ?
              WHERE id = ?
            `)
            .bind(
              userPlan,
              expiresAt,
              user.id
            )
            .run();

        } catch (userUpdateError) {

          // Awaryjnie cofamy oznaczenie kodu,
          // jeżeli aktualizacja konta się nie uda.

          await env.mullar_db
            .prepare(`
              UPDATE activation_codes
              SET
                redeemed = 0,
                redeemed_by = NULL,
                redeemed_at = NULL
              WHERE id = ?
            `)
            .bind(
              activation.id
            )
            .run();

          throw userUpdateError;
        }


        return json(
          request,
          {
            success: true,

            message:
              userPlan === "premium"
                ? "Premium zostało aktywowane."
                : "PRO zostało aktywowane na 7 dni."
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              "Wystąpił błąd podczas aktywacji kodu.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // ADMIN - GENERATE CODE
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/admin/generate-code"
    ) {

      try {

        const adminKey =
          request.headers.get(
            "X-Admin-Key"
          );


        if (
          !adminKey ||
          adminKey !== env.ADMIN_KEY
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Brak dostępu."
            },
            403
          );
        }


        const body =
          await request.json();

        const plan =
          String(
            body.plan || ""
          )
            .trim()
            .toLowerCase();


        if (
          plan !== "pro" &&
          plan !== "premium"
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Nieprawidłowy plan."
            },
            400
          );
        }


        let code = null;


        for (
          let attempt = 0;
          attempt < 10;
          attempt++
        ) {

          const candidate =
            generateActivationCode(
              plan
            );


          const existing =
            await env.mullar_db
              .prepare(`
                SELECT id
                FROM activation_codes
                WHERE code = ?
                LIMIT 1
              `)
              .bind(candidate)
              .first();


          if (!existing) {

            code =
              candidate;

            break;
          }
        }


        if (!code) {

          return json(
            request,
            {
              success: false,

              message:
                "Nie udało się wygenerować unikalnego kodu."
            },
            500
          );
        }


        await env.mullar_db
          .prepare(`
            INSERT INTO activation_codes (
              code,
              plan
            )
            VALUES (?, ?)
          `)
          .bind(
            code,
            plan
          )
          .run();


        return json(
          request,
          {
            success: true,

            code,

            plan
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              "Nie udało się wygenerować kodu.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // LOGOUT
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/logout"
    ) {

      try {

        const token =
          getToken(request);


        if (token) {

          await env.mullar_db
            .prepare(`
              DELETE FROM sessions
              WHERE token = ?
            `)
            .bind(token)
            .run();
        }


        return json(
          request,
          {
            ok: true,

            message:
              "Wylogowano."
          }
        );

      } catch (error) {

        return json(
          request,
          {
            ok: false,

            error:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // UPLOAD PLACEHOLDERS
    // ========================================

    if (
      request.method === "POST" &&
      (
        url.pathname ===
          "/api/profile/avatar" ||
        url.pathname ===
          "/api/profile/banner"
      )
    ) {

      return json(
        request,
        {
          success: false,

          message:
            "Upload plików nie jest jeszcze skonfigurowany."
        },
        503
      );
    }


    // ========================================
    // NOT FOUND
    // ========================================

    return json(
      request,
      {
        ok: false,

        error:
          "Nie znaleziono endpointu."
      },
      404
    );
  }
};