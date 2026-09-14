const ALLOWED_ORIGINS = new Set([
  "https://mullar.online",
  "https://www.mullar.online",
  "http://127.0.0.1:3000",
  "http://localhost:3000"
]);

const OG_CUTOFF =
  new Date("2026-09-30T23:59:59.999Z");

const AVATAR_MAX_BYTES =
  5 * 1024 * 1024;

const BANNER_MAX_BYTES =
  8 * 1024 * 1024;

const ALLOWED_ANIMATIONS =
  new Set([
    "none",
    "float",
    "pulse",
    "glow",
    "tilt",
    "bounce"
  ]);


function getCorsOrigin(request) {

  const origin =
    request.headers.get("Origin");

  if (
    origin &&
    ALLOWED_ORIGINS.has(origin)
  ) {
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
    request.headers.get(
      "Authorization"
    );

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


async function hashPassword(
  password
) {

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


function createToken() {

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


function randomPart() {

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


function generateActivationCode(
  plan
) {

  const prefix =
    plan === "pro"
      ? "MLR-PRO"
      : "MLR-PREM";

  return [
    prefix,
    randomPart(),
    randomPart(),
    randomPart()
  ].join("-");
}


function isPremium(user) {

  return String(
    user?.plan || "free"
  ).toLowerCase() ===
    "premium";
}


function isPro(user) {

  const plan =
    String(
      user?.plan || "free"
    ).toLowerCase();

  return (
    plan === "pro" ||
    plan === "premium"
  );
}


function isOgEligible(user) {

  if (!user?.created_at) {
    return false;
  }

  const created =
    new Date(
      user.created_at
    );

  if (
    Number.isNaN(
      created.getTime()
    )
  ) {
    return false;
  }

  return (
    created.getTime() <=
    OG_CUTOFF.getTime()
  );
}


function publicUser(user) {

  return {
    id:
      user.id,

    username:
      user.username,

    email:
      user.email,

    plan:
      user.plan,

    plan_expires_at:
      user.plan_expires_at,

    bio:
      user.bio || "",

    discord:
      user.discord || "",

    github:
      user.github || "",

    instagram:
      user.instagram || "",

    avatar:
      user.avatar || "",

    banner:
      user.banner || "",

    og_hidden:
      Number(
        user.og_hidden || 0
      ),

    likes_enabled:
      Number(
        user.likes_enabled || 0
      ),

    views_enabled:
      Number(
        user.views_enabled ?? 1
      ),

    likes_count:
      Number(
        user.likes_count || 0
      ),

    views_count:
      Number(
        user.views_count || 0
      ),

    profile_color:
      user.profile_color ||
      "#0e0e0e",

    name_color:
      user.name_color ||
      "#ffffff",

    neon_name:
      Number(
        user.neon_name || 0
      ),

    glow1_color:
      user.glow1_color ||
      "#6b4cff",

    glow2_color:
      user.glow2_color ||
      "#00aaff",

    extra_links:
      user.extra_links || "[]",

    music_url:
      user.music_url || "",

    profile_animation:
      user.profile_animation ||
      "none",

    created_at:
      user.created_at
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
        SELECT users.*
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


function cleanHttpUrl(
  value
) {

  const input =
    String(value || "")
      .trim();

  if (!input) {
    return "";
  }

  try {

    const url =
      new URL(input);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "";
    }

    return url.href;

  } catch {

    return "";
  }
}


function parseLinks(
  value
) {

  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {

    const parsed =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {

    return [];
  }
}


function normalizeLinks(
  value,
  max,
  premium
) {

  const input =
    parseLinks(value);

  const result = [];


  for (
    const item of input.slice(
      0,
      max
    )
  ) {

    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }


    const title =
      String(
        item.title || ""
      )
      .trim()
      .slice(0, 60);


    const url =
      cleanHttpUrl(
        item.url
      );


    const icon =
      premium
        ? cleanHttpUrl(
            item.icon
          )
        : "";


    if (
      !title ||
      !url
    ) {
      continue;
    }


    result.push({
      title,
      url,
      icon
    });
  }


  return result;
}


function extensionFromType(
  type
) {

  const map = {

    "image/jpeg":
      "jpg",

    "image/png":
      "png",

    "image/webp":
      "webp",

    "image/gif":
      "gif"
  };

  return map[type] || null;
}


function getMediaKeyFromUrl(
  value
) {

  try {

    const url =
      new URL(value);

    const marker =
      "/media/";

    const index =
      url.pathname.indexOf(
        marker
      );

    if (
      index === -1
    ) {
      return null;
    }

    return decodeURIComponent(
      url.pathname.slice(
        index + marker.length
      )
    );

  } catch {

    return null;
  }
}


function makeMediaUrl(
  request,
  key
) {

  const origin =
    new URL(
      request.url
    ).origin;

  return (
    origin +
    "/media/" +
    encodeURIComponent(
      key
    )
  );
}


async function saveUploadedImage(
  request,
  env,
  user,
  type
) {

  if (!env.MULLAR_MEDIA) {

    throw new Error(
      "R2 nie jest podłączone do Workera."
    );
  }


  const contentType =
    request.headers.get(
      "Content-Type"
    ) || "";


  if (
    !contentType.startsWith(
      "multipart/form-data"
    )
  ) {

    throw new Error(
      "Upload musi używać multipart/form-data."
    );
  }


  const formData =
    await request.formData();

  const file =
    formData.get("file");


  if (
    !file ||
    typeof file.arrayBuffer !==
      "function"
  ) {

    throw new Error(
      "Nie wybrano pliku."
    );
  }


  const maxSize =
    type === "avatar"
      ? AVATAR_MAX_BYTES
      : BANNER_MAX_BYTES;


  if (
    file.size >
    maxSize
  ) {

    throw new Error(
      type === "avatar"
        ? "Avatar może mieć maksymalnie 5 MB."
        : "Banner może mieć maksymalnie 8 MB."
    );
  }


  const extension =
    extensionFromType(
      file.type
    );


  if (!extension) {

    throw new Error(
      "Dozwolone są JPG, PNG, WEBP i GIF."
    );
  }


  const randomBytes =
    new Uint8Array(16);

  crypto.getRandomValues(
    randomBytes
  );


  const randomId =
    Array.from(
      randomBytes
    )
      .map(
        byte =>
          byte
            .toString(16)
            .padStart(2, "0")
      )
      .join("");


  const folder =
    type === "avatar"
      ? "avatars"
      : "banners";


  const key =
    `${folder}/${user.id}-${Date.now()}-${randomId}.${extension}`;


  const oldUrl =
    user[type] || "";


  await env.MULLAR_MEDIA.put(
    key,
    file,
    {
      httpMetadata: {
        contentType:
          file.type,

        cacheControl:
          "public, max-age=31536000, immutable"
      }
    }
  );


  if (oldUrl) {

    const oldKey =
      getMediaKeyFromUrl(
        oldUrl
      );


    if (
      oldKey &&
      oldKey.startsWith(
        `${folder}/`
      )
    ) {

      try {

        await env.MULLAR_MEDIA.delete(
          oldKey
        );

      } catch {
        // Nie blokujemy nowego uploadu.
      }
    }
  }


  return makeMediaUrl(
    request,
    key
  );
}


export default {

  async fetch(
    request,
    env
  ) {

    // ========================================
    // OPTIONS / CORS
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
      new URL(
        request.url
      );


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
              Number(
                result?.count || 0
              )
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
    // R2 MEDIA GET
    // ========================================

    if (
      request.method === "GET" &&
      url.pathname.startsWith(
        "/media/"
      )
    ) {

      try {

        if (!env.MULLAR_MEDIA) {

          return new Response(
            "R2 not configured",
            {
              status: 500
            }
          );
        }


        const encodedKey =
          url.pathname.slice(
            "/media/".length
          );


        const key =
          decodeURIComponent(
            encodedKey
          );


        if (!key) {

          return new Response(
            "Not found",
            {
              status: 404
            }
          );
        }


        const object =
          await env.MULLAR_MEDIA.get(
            key
          );


        if (!object) {

          return new Response(
            "Not found",
            {
              status: 404,

              headers:
                corsHeaders(request)
            }
          );
        }


        const headers =
          new Headers(
            corsHeaders(request)
          );


        object.writeHttpMetadata(
          headers
        );


        headers.set(
          "ETag",
          object.httpEtag
        );


        return new Response(
          object.body,
          {
            headers
          }
        );

      } catch (error) {

        return new Response(
          error.message,
          {
            status: 500,

            headers:
              corsHeaders(request)
          }
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
          createToken();


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
    // ME
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

              loggedIn:
                false
            },
            401
          );
        }


        return json(
          request,
          {
            ok: true,

            loggedIn:
              true,

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
      ) &&
      !url.pathname.endsWith(
        "/view"
      ) &&
      !url.pathname.endsWith(
        "/like"
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
                created_at,
                og_hidden,
                likes_enabled,
                views_enabled,
                likes_count,
                views_count,
                profile_color,
                name_color,
                neon_name,
                glow1_color,
                glow2_color,
                extra_links,
                music_url,
                profile_animation
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

            profile: {
              ...profile,

              og_eligible:
                isOgEligible(
                  profile
                ),

              og_visible:
                isOgEligible(
                  profile
                ) &&
                Number(
                  profile.og_hidden || 0
                ) !== 1,

              profile_animation:
                ALLOWED_ANIMATIONS.has(
                  profile.profile_animation
                )
                  ? profile.profile_animation
                  : "none"
            }
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
          )
          .trim()
          .slice(
            0,
            500
          );


        const discord =
          String(
            body.discord || ""
          )
          .trim()
          .slice(
            0,
            200
          );


        const github =
          String(
            body.github || ""
          )
          .trim()
          .slice(
            0,
            200
          );


        const instagram =
          String(
            body.instagram || ""
          )
          .trim()
          .slice(
            0,
            200
          );


        const ogHidden =
          Number(
            body.og_hidden || 0
          ) === 1
            ? 1
            : 0;


        const viewsEnabled =
          Number(
            body.views_enabled ?? 1
          ) === 1
            ? 1
            : 0;


        const likesEnabled =
          isPro(user) &&
          Number(
            body.likes_enabled || 0
          ) === 1
            ? 1
            : 0;


        const profileColor =
          isPro(user)
            ? String(
                body.profile_color ||
                "#0e0e0e"
              )
            : user.profile_color ||
              "#0e0e0e";


        const nameColor =
          isPro(user)
            ? String(
                body.name_color ||
                "#ffffff"
              )
            : user.name_color ||
              "#ffffff";


        const glow1 =
          isPro(user)
            ? String(
                body.glow1_color ||
                "#6b4cff"
              )
            : user.glow1_color ||
              "#6b4cff";


        const glow2 =
          isPro(user)
            ? String(
                body.glow2_color ||
                "#00aaff"
              )
            : user.glow2_color ||
              "#00aaff";


        const neonName =
          isPremium(user) &&
          Number(
            body.neon_name || 0
          ) === 1
            ? 1
            : 0;


        const animationInput =
          String(
            body.profile_animation ||
            "none"
          );


        const profileAnimation =
          isPremium(user) &&
          ALLOWED_ANIMATIONS.has(
            animationInput
          )
            ? animationInput
            : "none";


        let extraLinks = [];


        if (isPremium(user)) {

          extraLinks =
            normalizeLinks(
              body.extra_links,
              5,
              true
            );

        } else if (isPro(user)) {

          extraLinks =
            normalizeLinks(
              body.extra_links,
              2,
              false
            );

        } else {

          extraLinks =
            normalizeLinks(
              body.extra_links,
              1,
              false
            );
        }


        const musicUrl =
          isPremium(user)
            ? cleanHttpUrl(
                body.music_url
              )
            : user.music_url ||
              "";


        const avatar =
          cleanHttpUrl(
            body.avatar ||
            user.avatar ||
            ""
          );


        const banner =
          cleanHttpUrl(
            body.banner ||
            user.banner ||
            ""
          );


        if (
          !/^#[0-9a-fA-F]{6}$/.test(
            profileColor
          )
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Nieprawidłowy kolor profilu."
            },
            400
          );
        }


        if (
          !/^#[0-9a-fA-F]{6}$/.test(
            nameColor
          )
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Nieprawidłowy kolor nazwy."
            },
            400
          );
        }


        if (
          !/^#[0-9a-fA-F]{6}$/.test(
            glow1
          ) ||
          !/^#[0-9a-fA-F]{6}$/.test(
            glow2
          )
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Nieprawidłowy kolor glow."
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
              instagram = ?,
              avatar = ?,
              banner = ?,
              og_hidden = ?,
              likes_enabled = ?,
              views_enabled = ?,
              profile_color = ?,
              name_color = ?,
              neon_name = ?,
              glow1_color = ?,
              glow2_color = ?,
              extra_links = ?,
              music_url = ?,
              profile_animation = ?
            WHERE id = ?
          `)
          .bind(
            bio,
            discord,
            github,
            instagram,
            avatar,
            banner,
            ogHidden,
            likesEnabled,
            viewsEnabled,
            profileColor,
            nameColor,
            neonName,
            glow1,
            glow2,
            JSON.stringify(
              extraLinks
            ),
            musicUrl,
            profileAnimation,
            user.id
          )
          .run();


        return json(
          request,
          {
            success: true,

            message:
              "Profil został zapisany.",

            profile_animation:
              profileAnimation,

            avatar,

            extra_links:
              extraLinks
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
    // AVATAR UPLOAD
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/profile/avatar"
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


        const mediaUrl =
          await saveUploadedImage(
            request,
            env,
            user,
            "avatar"
          );


        await env.mullar_db
          .prepare(`
            UPDATE users
            SET avatar = ?
            WHERE id = ?
          `)
          .bind(
            mediaUrl,
            user.id
          )
          .run();


        return json(
          request,
          {
            success: true,

            message:
              "Avatar został przesłany.",

            url:
              mediaUrl
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              error.message ||
              "Nie udało się przesłać avatara."
          },
          400
        );
      }
    }


    // ========================================
    // BANNER UPLOAD
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/profile/banner"
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


        const mediaUrl =
          await saveUploadedImage(
            request,
            env,
            user,
            "banner"
          );


        await env.mullar_db
          .prepare(`
            UPDATE users
            SET banner = ?
            WHERE id = ?
          `)
          .bind(
            mediaUrl,
            user.id
          )
          .run();


        return json(
          request,
          {
            success: true,

            message:
              "Banner został przesłany.",

            url:
              mediaUrl
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              error.message ||
              "Nie udało się przesłać bannera."
          },
          400
        );
      }
    }


    // ========================================
    // PROFILE VIEW
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname.match(
        /^\/api\/profile\/[^/]+\/view$/
      )
    ) {

      try {

        const profileUsername =
          decodeURIComponent(
            url.pathname
              .replace(
                "/api/profile/",
                ""
              )
              .replace(
                "/view",
                ""
              )
          );


        const profile =
          await env.mullar_db
            .prepare(`
              SELECT
                id,
                views_enabled
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


        if (
          Number(
            profile.views_enabled ?? 1
          ) !== 1
        ) {

          return json(
            request,
            {
              success: true,

              views_count: 0
            }
          );
        }


        await env.mullar_db
          .prepare(`
            UPDATE users
            SET views_count =
              views_count + 1
            WHERE id = ?
          `)
          .bind(
            profile.id
          )
          .run();


        const result =
          await env.mullar_db
            .prepare(`
              SELECT views_count
              FROM users
              WHERE id = ?
            `)
            .bind(
              profile.id
            )
            .first();


        return json(
          request,
          {
            success: true,

            views_count:
              Number(
                result?.views_count ||
                0
              )
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              "Nie udało się zarejestrować wyświetlenia.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // PROFILE LIKE
    // ========================================

    if (
      request.method === "POST" &&
      url.pathname.match(
        /^\/api\/profile\/[^/]+\/like$/
      )
    ) {

      try {

        const profileUsername =
          decodeURIComponent(
            url.pathname
              .replace(
                "/api/profile/",
                ""
              )
              .replace(
                "/like",
                ""
              )
          );


        const profile =
          await env.mullar_db
            .prepare(`
              SELECT
                id,
                plan,
                likes_enabled
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


        if (
          Number(
            profile.likes_enabled || 0
          ) !== 1
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Polubienia są wyłączone."
            },
            403
          );
        }


        if (
          profile.plan !== "pro" &&
          profile.plan !== "premium"
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Polubienia są dostępne dla PRO i Premium."
            },
            403
          );
        }


        await env.mullar_db
          .prepare(`
            UPDATE users
            SET likes_count =
              likes_count + 1
            WHERE id = ?
          `)
          .bind(
            profile.id
          )
          .run();


        const result =
          await env.mullar_db
            .prepare(`
              SELECT likes_count
              FROM users
              WHERE id = ?
            `)
            .bind(
              profile.id
            )
            .first();


        return json(
          request,
          {
            success: true,

            likes_count:
              Number(
                result?.likes_count ||
                0
              )
          }
        );

      } catch (error) {

        return json(
          request,
          {
            success: false,

            message:
              "Nie udało się polubić profilu.",

            details:
              error.message
          },
          500
        );
      }
    }


    // ========================================
    // REDEEM PRO / PREMIUM
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
            .bind(
              code
            )
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


        const activationPlan =
          String(
            activation.plan || ""
          )
          .trim()
          .toLowerCase();


        if (
          activationPlan !== "pro" &&
          activationPlan !== "premium"
        ) {

          return json(
            request,
            {
              success: false,

              message:
                "Kod ma nieprawidłowy plan."
            },
            400
          );
        }


        let userPlan =
          activationPlan;

        let expiresAt =
          null;


        if (
          activationPlan === "pro"
        ) {

          const expiration =
            new Date();

          expiration.setDate(
            expiration.getDate() + 7
          );

          expiresAt =
            expiration.toISOString();
        }


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

        } catch (error) {

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

          throw error;
        }


        return json(
          request,
          {
            success: true,

            message:
              userPlan === "premium"
                ? "Premium zostało aktywowane."
                : "PRO zostało aktywowane na 7 dni.",

            plan:
              userPlan,

            plan_expires_at:
              expiresAt
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
          adminKey !==
            env.ADMIN_KEY
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
              .bind(
                candidate
              )
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
                "Nie udało się wygenerować kodu."
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
            .bind(
              token
            )
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
    // 404
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