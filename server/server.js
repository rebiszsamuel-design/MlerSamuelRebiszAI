const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");

const db = require("./database");

const app = express();
const PORT = 3000;

const ADMIN_EMAIL = "sameksamuel17@gmail.com";

// ================================
// UPLOADS
// ================================

const uploadDirectory = path.join(
    __dirname,
    "..",
    "public",
    "uploads"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension =
            path.extname(file.originalname).toLowerCase();

        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Dozwolone są tylko JPG, PNG, WEBP i GIF."
                )
            );
        }

        cb(null, true);
    }
});

// ================================
// MIDDLEWARE
// ================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "MULLAR_LOCAL_SECRET_CHANGE_LATER",
    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(
    express.static(
        path.join(__dirname, "..", "public")
    )
);

// ================================
// PLAN CHECK
// ================================

function getEffectivePlan(user) {

    if (
        user.plan === "pro" &&
        user.plan_expires_at
    ) {

        const expiresAt =
            new Date(user.plan_expires_at);

        if (
            Number.isNaN(expiresAt.getTime()) ||
            expiresAt <= new Date()
        ) {
            return "free";
        }
    }

    return user.plan;
}

// ================================
// ADMIN CHECK
// ================================

function requireAdmin(req, res, next) {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message:
                "Musisz być zalogowany."
        });
    }

    const user = db.prepare(`
        SELECT
            id,
            email
        FROM users
        WHERE id = ?
    `).get(req.session.userId);

    if (!user) {
        return res.status(401).json({
            success: false,
            message:
                "Nie znaleziono użytkownika."
        });
    }

    if (
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
    ) {
        return res.status(403).json({
            success: false,
            message:
                "Brak dostępu do panelu administratora."
        });
    }

    next();
}

// ================================
// REGISTER
// ================================

app.post("/api/register", async (req, res) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Wszystkie pola są wymagane."
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message:
                    "Username musi mieć minimum 3 znaki."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Hasło musi mieć minimum 6 znaków."
            });
        }

        const existingUser = db.prepare(`
            SELECT id
            FROM users
            WHERE username = ? OR email = ?
        `).get(username, email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "Username lub email jest już zajęty."
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 12);

        const result = db.prepare(`
            INSERT INTO users (
                username,
                email,
                password
            )
            VALUES (?, ?, ?)
        `).run(
            username,
            email,
            passwordHash
        );

        res.status(201).json({
            success: true,
            message:
                "Konto zostało utworzone!",
            userId:
                result.lastInsertRowid
        });

    } catch (error) {

        console.error(
            "Błąd rejestracji:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Wystąpił błąd serwera."
        });
    }
});

// ================================
// LOGIN
// ================================

app.post("/api/login", async (req, res) => {

    try {

        const {
            login,
            password
        } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Wpisz login i hasło."
            });
        }

        const user = db.prepare(`
            SELECT *
            FROM users
            WHERE username = ? OR email = ?
        `).get(login, login);

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Nieprawidłowy login lub hasło."
            });
        }

        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message:
                    "Nieprawidłowy login lub hasło."
            });
        }

        req.session.userId =
            user.id;

        res.json({
            success: true,
            message:
                "Zalogowano!",
            username:
                user.username
        });

    } catch (error) {

        console.error(
            "Błąd logowania:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Wystąpił błąd serwera."
        });
    }
});

// ================================
// CURRENT USER
// ================================

app.get("/api/me", (req, res) => {

    if (!req.session.userId) {
        return res.json({
            loggedIn: false
        });
    }

    const user = db.prepare(`
        SELECT
            id,
            username,
            email,
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
        WHERE id = ?
    `).get(req.session.userId);

    if (!user) {

        req.session.destroy(() => {});

        return res.json({
            loggedIn: false
        });
    }

    user.plan =
        getEffectivePlan(user);

    res.json({
        loggedIn: true,
        user
    });
});

// ================================
// ADMIN PAGE ACCESS
// ================================

app.get(
    "/api/admin/check",
    requireAdmin,
    (req, res) => {

        res.json({
            success: true,
            admin: true
        });
    }
);

// ================================
// ADMIN GENERATE CODE
// ================================

app.post(
    "/api/admin/generate-code",
    requireAdmin,
    (req, res) => {

        const plan =
            String(req.body.plan || "")
                .trim()
                .toLowerCase();

        if (
            plan !== "pro" &&
            plan !== "premium"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nieprawidłowy plan."
            });
        }

        const prefix =
            plan === "pro"
                ? "MULLAR-PRO"
                : "MULLAR-PREM";

        let code;

        do {

            const randomPart =
                crypto
                    .randomBytes(8)
                    .toString("hex")
                    .toUpperCase();

            code =
                `${prefix}-${randomPart}`;

        } while (
            db.prepare(`
                SELECT id
                FROM activation_codes
                WHERE code = ?
            `).get(code)
        );

        db.prepare(`
            INSERT INTO activation_codes (
                code,
                plan
            )
            VALUES (?, ?)
        `).run(
            code,
            plan
        );

        res.json({
            success: true,
            plan: plan,
            code: code
        });
    }
);

// ================================
// REDEEM ACTIVATION CODE
// ================================

app.post(
    "/api/redeem-code",
    (req, res) => {

        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Musisz być zalogowany."
            });
        }

        const rawCode =
            req.body.code;

        if (!rawCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Wpisz kod aktywacyjny."
            });
        }

        const code =
            String(rawCode)
                .trim()
                .toUpperCase();

        const transaction =
            db.transaction(() => {

                const activationCode =
                    db.prepare(`
                        SELECT *
                        FROM activation_codes
                        WHERE code = ?
                    `).get(code);

                if (!activationCode) {
                    throw new Error(
                        "INVALID_CODE"
                    );
                }

                if (activationCode.redeemed) {
                    throw new Error(
                        "CODE_ALREADY_REDEEMED"
                    );
                }

                const currentUser =
                    db.prepare(`
                        SELECT
                            id,
                            plan,
                            plan_expires_at
                        FROM users
                        WHERE id = ?
                    `).get(
                        req.session.userId
                    );

                if (!currentUser) {
                    throw new Error(
                        "USER_NOT_FOUND"
                    );
                }

                const currentPlan =
                    getEffectivePlan(
                        currentUser
                    );

                if (
                    currentPlan === "premium"
                ) {
                    throw new Error(
                        "ALREADY_PREMIUM"
                    );
                }

                if (
                    currentPlan ===
                    activationCode.plan
                ) {
                    throw new Error(
                        "SAME_PLAN"
                    );
                }

                let expiresAt = null;

                if (
                    activationCode.plan ===
                    "pro"
                ) {

                    expiresAt =
                        new Date(
                            Date.now() +
                            7 *
                            24 *
                            60 *
                            60 *
                            1000
                        ).toISOString();
                }

                db.prepare(`
                    UPDATE users
                    SET
                        plan = ?,
                        plan_expires_at = ?
                    WHERE id = ?
                `).run(
                    activationCode.plan,
                    expiresAt,
                    req.session.userId
                );

                db.prepare(`
                    UPDATE activation_codes
                    SET
                        redeemed = 1,
                        redeemed_by = ?,
                        redeemed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    req.session.userId,
                    activationCode.id
                );

                return {
                    plan:
                        activationCode.plan,
                    expiresAt
                };
            });

        try {

            const result =
                transaction();

            res.json({
                success: true,
                message:
                    result.plan === "pro"
                        ? "Mullar PRO aktywowany na 7 dni!"
                        : "Mullar Premium aktywowany na zawsze!",
                plan:
                    result.plan,
                plan_expires_at:
                    result.expiresAt
            });

        } catch (error) {

            if (
                error.message ===
                "INVALID_CODE"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Nieprawidłowy kod."
                });
            }

            if (
                error.message ===
                "CODE_ALREADY_REDEEMED"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Ten kod został już wykorzystany."
                });
            }

            if (
                error.message ===
                "ALREADY_PREMIUM"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Masz już Mullar Premium."
                });
            }

            if (
                error.message ===
                "SAME_PLAN"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Masz już aktywny ten plan."
                });
            }

            if (
                error.message ===
                "USER_NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Nie znaleziono użytkownika."
                });
            }

            console.error(
                "Błąd aktywacji kodu:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Wystąpił błąd podczas aktywacji kodu."
            });
        }
    }
);

// ================================
// UPDATE PROFILE
// ================================

app.post(
    "/api/profile/update",
    (req, res) => {

        try {

            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Musisz być zalogowany."
                });
            }

            const {
                bio,
                discord,
                github,
                instagram,
                avatar,
                banner
            } = req.body;

            db.prepare(`
                UPDATE users
                SET
                    bio = ?,
                    discord = ?,
                    github = ?,
                    instagram = ?,
                    avatar = ?,
                    banner = ?
                WHERE id = ?
            `).run(
                bio || "",
                discord || "",
                github || "",
                instagram || "",
                avatar || "",
                banner || "",
                req.session.userId
            );

            res.json({
                success: true,
                message:
                    "Profil został zapisany!"
            });

        } catch (error) {

            console.error(
                "Błąd aktualizacji profilu:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Nie udało się zapisać profilu."
            });
        }
    }
);

// ================================
// UPLOAD AVATAR
// ================================

app.post(
    "/api/profile/avatar",
    (req, res) => {

        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Musisz być zalogowany."
            });
        }

        upload.single("avatar")(
            req,
            res,
            (error) => {

                if (error) {
                    return res.status(400).json({
                        success: false,
                        message:
                            error.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Nie wybrano obrazka."
                    });
                }

                const imageUrl =
                    `/uploads/${req.file.filename}`;

                db.prepare(`
                    UPDATE users
                    SET avatar = ?
                    WHERE id = ?
                `).run(
                    imageUrl,
                    req.session.userId
                );

                res.json({
                    success: true,
                    message:
                        "Avatar został przesłany!",
                    url: imageUrl
                });
            }
        );
    }
);

// ================================
// UPLOAD BANNER
// ================================

app.post(
    "/api/profile/banner",
    (req, res) => {

        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Musisz być zalogowany."
            });
        }

        upload.single("banner")(
            req,
            res,
            (error) => {

                if (error) {
                    return res.status(400).json({
                        success: false,
                        message:
                            error.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Nie wybrano obrazka."
                    });
                }

                const imageUrl =
                    `/uploads/${req.file.filename}`;

                db.prepare(`
                    UPDATE users
                    SET banner = ?
                    WHERE id = ?
                `).run(
                    imageUrl,
                    req.session.userId
                );

                res.json({
                    success: true,
                    message:
                        "Banner został przesłany!",
                    url: imageUrl
                });
            }
        );
    }
);

// ================================
// LOGOUT
// ================================

app.post(
    "/api/logout",
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {
                    return res.status(500).json({
                        success: false,
                        message:
                            "Nie udało się wylogować."
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Wylogowano."
                });
            }
        );
    }
);

// ================================
// PUBLIC PROFILE API
// ================================

app.get(
    "/api/profile/:username",
    (req, res) => {

        const username =
            req.params.username;

        const user = db.prepare(`
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
        `).get(username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "Nie znaleziono użytkownika."
            });
        }

        user.plan =
            getEffectivePlan(user);

        res.json({
            success: true,
            profile: user
        });
    }
);

// ================================
// PUBLIC PROFILE PAGE
// ================================

app.get(
    "/u/:username",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "..",
                "public",
                "profile.html"
            )
        );
    }
);

// ================================
// ADMIN PAGE
// ================================

app.get(
    "/admin.html",
    (req, res) => {

        if (!req.session.userId) {
            return res.redirect(
                "/login.html"
            );
        }

        const user = db.prepare(`
            SELECT email
            FROM users
            WHERE id = ?
        `).get(req.session.userId);

        if (
            !user ||
            user.email.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {
            return res.status(403).send(
                "Brak dostępu."
            );
        }

        res.sendFile(
            path.join(
                __dirname,
                "..",
                "public",
                "admin.html"
            )
        );
    }
);

// ================================
// ERROR HANDLER
// ================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Błąd serwera:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Wystąpił błąd serwera."
        });
    }
);

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {

    console.log(
        `Mullar działa na http://127.0.0.1:${PORT}`
    );

    console.log(
        "Baza danych została podłączona."
    );
});