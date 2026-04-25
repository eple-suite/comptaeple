#!/usr/bin/env -S npx tsx
import * as fs from "fs";
const src = fs.readFileSync("src/pages/marches/docs/pieces.ts", "utf-8");
let ok = true;
const expect = (l: string, c: boolean) => { console.log((c ? "✓ " : "✗ ") + l); if (!c) ok = false; };
expect("RarLigne exportée", /export interface RarLigne/.test(src));
expect("generateRAR signature avec lignes & annee", /generateRAR\(ctx: DocContext, lignes: RarLigne\[\], annee: number\)/.test(src));
expect("Référence DAJ-REAP présente", /DAJ-REAP/.test(src));
expect("Mention 25 000 € HT (seuil de recensement)", /25 000 € HT/.test(src));
expect("Référence R2196-1 CCP", /R2196-1/.test(src));
process.exit(ok ? 0 : 1);
