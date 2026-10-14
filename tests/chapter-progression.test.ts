import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campaignVariants,getLevel,ENEMY_CHAPTERS,HUNTER_DEBUT_INDEX,GALLERY_INDEX} from '../src/game/LevelManager.ts';
import {World} from '../src/game/World.ts';
import {hunterTrial} from '../src/game/missions/hunterDebut.ts';
const kinds=['basic','patrol','tactical','hunter'] as const;
for(const count of [1,2,3,4]as const)test(`${count} players: exactly one new enemy every ten missions, with gradual formations and forty tactical layouts`,()=>{
  const campaign=campaignVariants[count];assert.equal(campaign.length,40);
  assert.equal(new Set(campaign.map(l=>l.design!.progression!.sourceId)).size,40,'every reviewed architecture remains in the campaign once');
  for(const [i,l]of campaign.entries()){
    const chapter=Math.floor(i/10),allowed=kinds.slice(0,chapter+1);
    assert.ok(l.enemies.every(e=>allowed.includes(e.kind)),`${l.id}: premature enemy`);
    assert.ok(l.enemies.some(e=>e.kind===kinds[chapter]));
    if(i%10===0&&i>0)assert.equal(l.enemies.filter(e=>e.kind===kinds[chapter]).length,1,'the debut is shared by the whole team');
    if(i>0)assert.ok(l.difficulty>campaign[i-1].difficulty,'the authored pressure curve increases at every mission');
    assert.equal(l.design!.progression!.chapter,chapter+1);
    assert.equal(l.design!.progression!.introduced,ENEMY_CHAPTERS[chapter].kind);
    assert.ok(l.design!.lesson.length>30);assert.ok(l.design!.routes.length>=count);
    assert.ok(l.enemies.length<=[0,7,9,10,11][count]);
    if(l.id<=20&&count>=3)assert.ok(l.enemies.length<=(count===3?8:9));
    if(count>1)assert.equal(l.playerSpawns?.length,count);
  }
  for(const [id,kind,total]of [[11,'patrol',1],[12,'patrol',2],[13,'patrol',3],[20,'patrol',6],[21,'tactical',1],[22,'tactical',2],[24,'tactical',3],[30,'tactical',5],[31,'hunter',1],[33,'hunter',2],[36,'hunter',3]]as const)
    assert.equal(getLevel(id-1,count).enemies.filter(e=>e.kind===kind).length,total,`${id}: the new enemy becomes more present through its chapter`);
  assert.equal(getLevel(GALLERY_INDEX,count).bankShotOnly,true);assert.ok(getLevel(GALLERY_INDEX,count).enemies.every(e=>e.kind==='tactical'));
  assert.equal(getLevel(HUNTER_DEBUT_INDEX,count).id,31);
  const practice=new World(hunterTrial(getLevel(HUNTER_DEBUT_INDEX,count)),count);
  assert.equal(practice.players.length,count);assert.equal(practice.enemies.length,1);assert.equal(practice.enemies[0].kind,'hunter');
});
test('the complete atlas contains the exact 160 playable variants and the four chapter boundaries',()=>{
  const html=readFileSync('public/campaign-review.html','utf8'),match=html.match(/const data=(.*?);let index=0;/s);assert.ok(match);
  const data=JSON.parse(match[1]);assert.equal(data.length,40);
  for(const [i,r]of data.entries())for(const count of [1,2,3,4]as const)assert.deepEqual(r.variants[count].level,getLevel(i,count));
});
