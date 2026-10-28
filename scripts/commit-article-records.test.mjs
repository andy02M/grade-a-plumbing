import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {commitArticleRecords} from './commit-article-records.mjs';

test('publication preserves dirty build assets, retries a remote race and records verification',()=>{
  const root=mkdtempSync(join(tmpdir(),'article-git-test-'));
  const repo=join(root,'repo'), remote=join(root,'remote.git'), other=join(root,'other');
  const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const write=(dir,file,value)=>writeFileSync(join(dir,file),value);
  try {
    mkdirSync(repo); git(root,'init','--bare',remote); git(repo,'init','-b','main');
    git(repo,'config','user.name','Test');git(repo,'config','user.email','test@example.com');
    mkdirSync(join(repo,'data'));
    for(const name of ['generated-articles','article-queue','article-publication-log','article-calendar-2026']) write(repo,`data/${name}.json`,'[]\n');
    write(repo,'asset.css','original\n');git(repo,'add','.');git(repo,'commit','-m','initial');
    git(repo,'remote','add','origin',remote);git(repo,'push','origin','main');
    git(root,'clone','--branch','main',remote,other);
    git(other,'config','user.name','Other');git(other,'config','user.email','other@example.com');
    write(repo,'asset.css','build-generated\n');write(repo,'scratch.txt','preserve me');
    write(repo,'data/generated-articles.json','[{"slug":"today"}]\n');
    const first=commitArticleRecords({cwd:repo,beforePush:({attempt})=>{
      if(attempt!==1)return;
      write(other,'website.txt','concurrent site fix');git(other,'add','.');git(other,'commit','-m','site fix');git(other,'push','origin','main');
    }});
    assert.equal(first.published,true);
    assert.equal(git(repo,'show',`${first.commit}:asset.css`),'original');
    assert.equal(git(repo,'show',`${first.commit}:website.txt`),'concurrent site fix');
    assert.equal(readFileSync(join(repo,'asset.css'),'utf8'),'build-generated\n');
    assert.equal(readFileSync(join(repo,'scratch.txt'),'utf8'),'preserve me');
    write(repo,'data/article-publication-log.json','[{"status":"verified"}]\n');
    const second=commitArticleRecords({cwd:repo,phase:'verify'});
    assert.equal(git(repo,'show',`${second.commit}:data/generated-articles.json`),'[{"slug":"today"}]');
    assert.equal(git(repo,'show',`${second.commit}:data/article-publication-log.json`),'[{"status":"verified"}]');
    assert.equal(commitArticleRecords({cwd:repo,phase:'verify'}).published,false);
    git(repo,'add','asset.css');
    assert.throws(()=>commitArticleRecords({cwd:repo}),/pre-existing staged/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
