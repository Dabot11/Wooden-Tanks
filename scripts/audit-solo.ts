import { writeFileSync } from 'node:fs';
import { levels, cooperativeLevels } from '../src/game/LevelManager.ts';
import { auditSolo } from '../src/game/SoloAudit.ts';
const audits = levels.map(level=>({level,before:cooperativeLevels[level.id-1],...auditSolo(level)}));
writeFileSync('.playwright/solo-audit.json',JSON.stringify(audits,null,2));
for(const audit of audits) console.log(`${String(audit.id).padStart(2,'0')} ${audit.level.name}: ${audit.issues.length ? audit.issues.join('; ') : 'OK'} · amenazas ${audit.directThreats} · distancia ${Math.round(audit.nearestEnemy)} · salidas ${audit.escapeDirections}`);
