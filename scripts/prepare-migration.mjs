import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const privateRoot=path.join(root,'migration-private');
if(fs.existsSync(path.join(privateRoot,'manifest.json')))throw new Error('Migration already prepared. Restore a clean source snapshot before rerunning.');
const entries=[],byPath=new Map(),courses=[{id:'digital-logic',title:'數位邏輯設計',description:'數字系統、邏輯閘、布林代數、組合與循序邏輯電路。',chapterCount:8,active:true},{id:'electronics-2',title:'電子學（下冊）',description:'電子學下冊章節教材、練習與題庫。',chapterCount:11,active:true}];
const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
const normalized=p=>path.relative(root,p).split(path.sep).join('/');
const targets=[...walk(path.join(root,'courses')).filter(p=>/\/chapter\d+\//.test(normalized(p)) && p.endsWith('.html')),...walk(path.join(root,'downloads')).filter(p=>p.endsWith('.pdf')),...walk(path.join(root,'assets/electronics-2'))];
for(const file of targets){
  const originalPath=normalized(file),courseId=originalPath.split('/')[1],chapterId=originalPath.match(/chapter\d+/)?.[0] || (originalPath.match(/ch(\d+)/)?'chapter'+originalPath.match(/ch(\d+)/)[1]:'overview');
  const type=file.endsWith('.html')?(file.includes('question-bank')?'quiz':'lesson'):file.endsWith('.pdf')?'pdf':'image';
  const id=(courseId+'-'+path.relative(path.join(root,originalPath.split('/')[0],courseId),file).replace(/index\.html$/,'lesson').replace(/\.[^.]+$/,'').split(path.sep).join('-')).replace(/[^a-z0-9-]/g,'-');
  const title=type==='lesson'||type==='quiz'?load(fs.readFileSync(file,'utf8'))('title').text().split('｜')[0]:path.basename(file);
  const resourceId=type==='image'?id+'-'+path.extname(file).slice(1):id;
  const entry={id:resourceId,courseId,chapterId,type,title,visibility:'student',active:true,filename:path.basename(file),originalPath,storagePath:'protected/'+courseId+'/'+resourceId+'/'+(type==='lesson'||type==='quiz'?'content.html':path.basename(file))};
  byPath.set(originalPath,entry);entries.push(entry);
  const backup=path.join(privateRoot,'original',originalPath);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(file,backup);
}
for(const entry of entries){
  const original=path.join(privateRoot,'original',entry.originalPath);
  let bytes=fs.readFileSync(original);
  if(['lesson','quiz'].includes(entry.type)){
    const $=load(bytes.toString('utf8'));const main=$('main').first();
    main.find('[href],[src]').each((i,node)=>{
      for(const attr of ['href','src']){const value=$(node).attr(attr);if(!value || value.startsWith('#') || /^[a-z]+:/i.test(value))continue;
        const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(entry.originalPath),value));
        const target=byPath.get(resolved);
        if(attr==='src' && target?.type==='image'){$(node).removeAttr('src').attr('data-protected-image',target.id);}
        else if(attr==='href' && target?.type==='pdf'){$(node).attr('href','SITE:resource.html?id='+target.id).removeAttr('download');}
        else $(node).attr(attr,'SITE:'+resolved);
      }
    });
    bytes=Buffer.from(main.html());
    if(!bytes.length)throw new Error('Empty lesson '+entry.id);
  }
  const destination=path.join(privateRoot,entry.storagePath);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);entry.sha256=crypto.createHash('sha256').update(bytes).digest('hex');entry.size=bytes.length;
}
const manifest={sourceCommit:'a44e6a13910b91a280f33403eaf89059781e091a',courses,resources:entries};
fs.writeFileSync(path.join(privateRoot,'manifest.json'),JSON.stringify(manifest,null,2));
// Only metadata is published. All lesson bytes, PDF and image backups remain gitignored.
fs.mkdirSync(path.join(root,'data'),{recursive:true});fs.writeFileSync(path.join(root,'data/resource-manifest.json'),JSON.stringify(manifest,null,2));
for(const entry of entries){
  const file=path.join(root,entry.originalPath);
  if(['lesson','quiz'].includes(entry.type)){
    const $=load(fs.readFileSync(file,'utf8'));$('main').first().html('<p class="status" data-status role="status">正在確認登入與課程權限…</p><div id="lesson-content" data-private data-course-id="'+entry.courseId+'" data-resource-id="'+entry.id+'" hidden></div><noscript>請啟用 JavaScript 並登入以閱讀教材。</noscript>');
    $('head').append('<link rel="stylesheet" href="../../../css/auth.css">');$('body').append('<script type="module" src="../../../js/lesson.js"></script>');
    $('#site-nav').append('<a href="../../../dashboard/">我的課程</a>');$('.nav-wrap').append('<button class="button ghost" data-logout hidden>登出</button>');fs.writeFileSync(file,$.html());
  }else{
    // Explicit per-file removal only after a byte-for-byte backup has been verified.
    if(!fs.readFileSync(file).equals(fs.readFileSync(path.join(privateRoot,'original',entry.originalPath))))throw new Error('Backup mismatch '+entry.originalPath);
    const resolved=path.resolve(file);if(!resolved.startsWith(root+path.sep))throw new Error('Unsafe path');fs.unlinkSync(resolved);
  }
}
for(const course of courses){const file=path.join(root,'courses',course.id,'index.html'),$=load(fs.readFileSync(file,'utf8'));$('main').attr('data-course-content',course.id).attr('hidden','');$('head').append('<link rel="stylesheet" href="../../css/auth.css">');$('body').append('<p class="status" data-status role="status">正在確認課程權限…</p><script type="module" src="../../js/course.js"></script>');$('#site-nav').append('<a href="../../dashboard/">我的課程</a>');$('.nav-wrap').append('<button class="button ghost" data-logout hidden>登出</button>');fs.writeFileSync(file,$.html());}
for(const p of ['index.html','about.html','courses/index.html']){const file=path.join(root,p),$=load(fs.readFileSync(file,'utf8')),prefix=p.startsWith('courses/')?'../':'';$('#site-nav').append('<a href="'+prefix+'login.html">登入</a>');fs.writeFileSync(file,$.html());}
console.log('Prepared '+entries.length+' protected resources. Originals safely retained only in migration-private/.');
