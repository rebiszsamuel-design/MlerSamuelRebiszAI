const crypto = require("crypto");
const db = require("./database");

const plan = process.argv[2];

if (!plan || !["pro", "premium"].includes(plan)) {
    console.log("");
    console.log("Użycie:");
    console.log("node server/generate-code.js pro");
    console.log("node server/generate-code.js premium");
    console.log("");
    process.exit(1);
}

function generateCode() {
    const randomPart = crypto
        .randomBytes(8)
        .toString("hex")
        .toUpperCase();

    const prefix =
        plan === "pro"
            ? "MULLAR-PRO"
            : "MULLAR-PREM";

    return `${prefix}-${randomPart}`;
}

let code;

do {
    code = generateCode();
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

console.log("");
console.log("================================");
console.log("      MULLAR CODE GENERATOR");
console.log("================================");
console.log("");
console.log(`Plan: ${plan.toUpperCase()}`);
console.log("");
console.log("NOWY KOD:");
console.log("");
console.log(code);
console.log("");
console.log("Kod został zapisany w bazie.");
console.log("Można go wykorzystać tylko raz.");
console.log("");
console.log("================================");
console.log("");