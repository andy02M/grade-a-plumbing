import {execFileSync} from 'node:child_process';
import {mkdtempSync, readdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

// Build tools can modify tracked asset manifests. Never include them in an
// article commit or try to rebase the build checkout with those edits present.
export function commitArticleRecords({cwd=process.cwd(),phase='prepare',remote='origin',branch='main',beforePush=()=>{}}={}) {
  const git=(args,dir=cwd)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  if(!['prepare','verify'].includes(phase)) throw Error('Unknown article commit phase');
  if(git(['diff','--cached','--name-only'])) throw Error('Refusing to commit pre-existing staged changes');
  const files=readdirSync(join(cwd,'data')).filter(name=>
    /^article-calendar-.*\.json$/.test(name)||
    ['article-publication-log.json',...(phase==='prepare'?['generated-articles.json','article-queue.json']:['article-queue-alert.json'])].includes(name)
  ).map(name=>`data/${name}`);
  git(['add','--',...files]);
  if(!git(['diff','--cached','--name-only'])) return {published:false};
  git(['-c','user.name=Grade A Plumbing publisher','-c','user.email=publisher@users.noreply.github.com','commit','-m',phase==='prepare'?'Record daily article preparation and editorial checks':'Record verified article deployment']);
  const parent=mkdtempSync(join(tmpdir(),'grade-a-publish-'));
  const clean=join(parent,'checkout');
  let attached=false;
  try {
    git(['worktree','add','--detach',clean,'HEAD']); attached=true;
    for(let attempt=1;attempt<=3;attempt++) {
      git(['fetch',remote,branch],clean);
      // Rebase only the clean publication worktree. Conflicts fail closed.
      git(['-c','user.name=Grade A Plumbing publisher','-c','user.email=publisher@users.noreply.github.com','rebase','FETCH_HEAD'],clean);
      beforePush({attempt,cwd:clean});
      try {
        git(['push',remote,`HEAD:refs/heads/${branch}`],clean);
        return {published:true,commit:git(['rev-parse','HEAD'],clean)};
      } catch(error) {
        if(attempt===3 || !/\[rejected\].*(fetch first|non-fast-forward)/s.test(String(error.stderr))) throw error;
      }
    }
  } finally {
    if(attached) git(['worktree','remove','--force',clean]);
    rmSync(parent,{recursive:true,force:true});
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(commitArticleRecords({phase:process.argv.includes('--verify')?'verify':'prepare'})));
}
