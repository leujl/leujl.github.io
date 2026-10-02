import fs from 'node:fs';import path from 'node:path';import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
export function buildSite() {
  const destination=path.resolve(root,'site');
  if(destination!==path.join(root,'site') || !destination.startsWith(root+path.sep))throw new Error('Unsafe output path');
  fs.rmSync(destination,{recursive:true,force:true});fs.mkdirSync(destination,{recursive:true});
  const copy=(source,target)=>{for(const entry of fs.readdirSync(source,{withFileTypes:true})){const src=path.join(source,entry.name),dst=path.join(target,entry.name);if(entry.isDirectory()){fs.mkdirSync(dst,{recursive:true});copy(src,dst);}else fs.copyFileSync(src,dst);}};
  for(const name of fs.readdirSync(root))if(name.endsWith('.html') || name==='.nojekyll')fs.copyFileSync(path.join(root,name),path.join(destination,name));
  for(const directory of ['css','js','courses','dashboard','admin','assets/icons']){fs.mkdirSync(path.join(destination,directory),{recursive:true});copy(path.join(root,directory),path.join(destination,directory));}
  console.log('Public site built: '+destination);
}
if(path.resolve(process.argv[1] || '')===fileURLToPath(import.meta.url))buildSite();

