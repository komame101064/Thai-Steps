import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=readdirSync(new URL('../tests/',import.meta.url)).filter(f=>f.endsWith('.test.cjs')).sort();
let failed=0;
for(const f of files){const r=spawnSync(process.execPath,['tests/'+f],{cwd:root,stdio:'inherit'});if(r.status!==0)failed++}
console.log(`${files.length-failed}/${files.length} test files passed`);process.exitCode=failed?1:0;
