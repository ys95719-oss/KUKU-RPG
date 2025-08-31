// ===============================
// バトルシステム with StageData + LevelSystem + StageProgress + EnemyLines + EnemyFadeout + IntroDialog
// ===============================

function wait(ms){return new Promise(r=>setTimeout(r,ms));}

// ==== ステージデータ ====
const StageData = {
  1:{name:"スラッピー", img:"Slime.png", bg:"grassland.png", hp:30, atk:7, def:3, recommendLv:1},
  2:{name:"バットラー", img:"bat.png", bg:"forest.png", hp:40, atk:10, def:5, recommendLv:5},
  3:{name:"ゴブゾー", img:"Goblins.png", bg:"Abandoned-village.png", hp:60, atk:12, def:6, recommendLv:8},
  4:{name:"ゴースティ", img:"ghost.png", bg:"church.png", hp:75, atk:14, def:8, recommendLv:12},
  5:{name:"メイジン", img:"magician.png", bg:"magic-tower.png", hp:90, atk:16, def:10, recommendLv:15},
  6:{name:"ウルフェン", img:"Wolf.png", bg:"Dark-Wilderness.png", hp:120, atk:18, def:12, recommendLv:20},
  7:{name:"火炎竜・ドラコーン", img:"Fire-Dragon.png", bg:"volcanic-areas.png", hp:180, atk:22, def:15, recommendLv:28},
  8:{name:"遺跡のガーディアン・ゴンドム", img:"Golem.png", bg:"ruins.png", hp:220, atk:25, def:18, recommendLv:35},
  9:{name:"闇の騎士・フェルシーン", img:"Dark-Knight.png", bg:"Dark-Castle.png", hp:260, atk:30, def:20, recommendLv:45},
  10:{name:"九九の力をうばうもの・魔王デスロード", img:"Demon-King.png", bg:"Demon-King's-Castle.png", hp:400, atk:40, def:25, recommendLv:50}
};

// ==== 敵の登場セリフ ====
const enemyLines = {
  1:{ intro:"ピピッ！ここからさきには いかせないぞ！" },
  2:{ intro:"キィー！おれさまの すばやさに ついてこれるか？" },
  3:{ intro:"グヘヘ…　こどもだと おもって あなどるなよ！" },
  4:{ intro:"ウウ…　よくぞ ここまできたな…　だが ここからは いかせぬ！" },
  5:{ intro:"わしの まほうで おまえを こなごなにしてやる！" },
  6:{ intro:"ガルルッ！　つよいやつと たたかえるのは うれしいぞ！" },
  7:{ intro:"フハハ！　おれの ほのおで もえつきろ！" },
  8:{ intro:"ゴゴゴ…　おまえは この いせきを こえることはできぬ！" },
  9:{ intro:"やみの ちからに みをゆだねた このちから…　うけてみよ！" },
  10:{ intro:"よくぞ きたな ゆうしゃよ。だが ここで おまえの ぼうけんは おわるのだ！" }
};

// ==== プレイヤー ====
// ★デバッグ用で強化済み
const hero = {hpMax:39,hp:30,atk:10,def:3,lv:1,exp:0,sp:0};

// ==== DOM ====
const hud=document.getElementById("hud"),
      field=document.getElementById("field"),
      panel=document.getElementById("panel"),
      heroBar=document.getElementById("hp-hero"),
      enemyBar=document.getElementById("hp-enemy"),
      spBar=document.getElementById("sp-bar"),
      lvEl=document.getElementById("hero-lv"),
      qEl=document.getElementById("question"),
      ans=document.getElementById("answer"),
      btnOk=document.getElementById("btn-ok"),
      numpad=document.querySelector(".numpad"),
      logEl=document.getElementById("battle-log"),
      skillsDiv=document.getElementById("skills"),
      heroImg=document.getElementById("hero-img"),
      enemyImg=document.getElementById("enemy-img"),
      bgImg=document.getElementById("bg"),
      result=document.getElementById("result"),
      resultTitle=document.getElementById("result-title"),
      resultMsg=document.getElementById("result-msg"),
      btnNext=document.getElementById("btn-next"),
      warning=document.getElementById("warning"),
      warningMsg=document.getElementById("warning-msg"),
      btnRetry=document.getElementById("btn-retry"),
      btnForce=document.getElementById("btn-force"),
      retryDialog=document.getElementById("retry-dialog"),
      btnRetrySame=document.getElementById("btn-retry-same"),
      btnRetryPrev=document.getElementById("btn-retry-prev"),
      enemyName=document.getElementById("enemy-name"),
      intro=document.getElementById("intro"),
      introImg=intro.querySelector("img"),
      introBubble=intro.querySelector(".bubble");

// ==== Audio ====
function playSE(id){const el=document.getElementById(id);if(el){el.currentTime=0;el.play();}}
const bgm=document.getElementById("bgm");

// ==== 共通関数 ====
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function setHP(el,cur,max){el.style.width=(clamp(cur/max*100,0,100))+"%";}
function log(m){let p=document.createElement("div");p.textContent=m;logEl.appendChild(p);logEl.scrollTop=logEl.scrollHeight;}
function newQuestion(){const a=Math.floor(Math.random()*9)+1,b=Math.floor(Math.random()*9)+1;answer=a*b;qEl.textContent=`${a} × ${b} = ?`;ans.value="";}

// ==== 解答チェック付き行動 ====
function checkAnswerThen(action){
  let v=parseInt(ans.value,10);
  if(Number.isNaN(v)){ locked=false; return; } 
  if(v===answer){ action(); } else { enemyAttack(); }
  hideSkills();
}

// ==== スキル選択 ====
function showAttackChoice(){
  skillsDiv.innerHTML = "";

  let atkBtn = document.createElement("button");
  atkBtn.textContent = "通常こうげき";
  atkBtn.onclick = ()=>{ checkAnswerThen(heroAttack); };
  skillsDiv.appendChild(atkBtn);

  LevelSystem.getSkillsForLevel(hero.lv).forEach(sk=>{
    let b=document.createElement("button");
    b.textContent = sk.name;
    b.onclick = ()=>{ checkAnswerThen(()=>useSkill(sk)); };
    skillsDiv.appendChild(b);
  });

  skillsDiv.style.display = "grid";
}

function hideSkills(){skillsDiv.style.display="none";}
function updateSP(){spBar.style.width=(hero.sp/4*100)+"%";}

// ==== バトル変数 ====
let currentStage=1;
let enemy, answer, locked=false;

// ==== ダメージ計算関数（新しい式） ====
function calcDamage(attacker, defender, isBoss=false){
  let base = attacker.atk - defender.def + Math.floor(Math.random()*3); // 引き算＋乱数0〜2
  if(isBoss) base += 5;  // 魔王補正：固定で+5ダメージ
  return Math.max(base, 3); // 最低保証3ダメージ
}

// ==== 攻撃処理 ====
async function heroAttack(){
  heroImg.classList.add("jump");playSE("se-attack");await wait(300);
  heroImg.classList.remove("jump");
  enemyImg.classList.add("blink");await wait(400);enemyImg.classList.remove("blink");

  let dmg = calcDamage(hero, enemy);
  enemy.hp=clamp(enemy.hp-dmg,0,enemy.hpMax);setHP(enemyBar,enemy.hp,enemy.hpMax);
  log(`ゆうしゃのこうげき！ ${enemy.name}に${dmg}ダメージ！`);

  hero.sp=Math.min(4,hero.sp+1);updateSP();
  if(hero.sp>=4)showAttackChoice();
  if(enemy.hp<=0)return endBattle(true);
  await wait(500);await enemyAttack();
}

async function enemyAttack(){
  enemyImg.classList.add("jump");playSE("se-attack");await wait(300);
  enemyImg.classList.remove("jump");
  heroImg.classList.add("blink");playSE("se-hurt");await wait(400);heroImg.classList.remove("blink");

  let dmg = calcDamage(enemy, hero, currentStage===10); // 魔王なら+5補正
  hero.hp=clamp(hero.hp-dmg,0,hero.hpMax);setHP(heroBar,hero.hp,hero.hpMax);
  log(`${enemy.name}のこうげき！ ゆうしゃは${dmg}ダメージ！`);

  if(hero.hp<=0)return endBattle(false);
  newQuestion();locked=false;
}

// ==== 特技 ====
async function useSkill(skill){
  log(`ゆうしゃは「${skill.name}」をくりだした！`);
  heroImg.classList.add("jump");playSE(skill.se);await wait(400);
  heroImg.classList.remove("jump");

  if(skill.type==="attack"){
    enemyImg.classList.add("blink");await wait(600);enemyImg.classList.remove("blink");
    let dmg=calcDamage({atk:Math.floor(hero.atk*skill.mult)}, enemy);
    enemy.hp=clamp(enemy.hp-dmg,0,enemy.hpMax);
    setHP(enemyBar,enemy.hp,enemy.hpMax);
    log(`${enemy.name}に${dmg}ダメージ！`);
    hero.sp=0;updateSP();
    if(enemy.hp<=0)return endBattle(true);
    await enemyAttack();
  }else if(skill.type==="heal"){
    heroImg.classList.add("blink");playSE(skill.se);await wait(600);heroImg.classList.remove("blink");
    let heal=Math.floor(hero.hpMax*skill.heal);
    hero.hp=clamp(hero.hp+heal,0,hero.hpMax);
    setHP(heroBar,hero.hp,hero.hpMax);
    log(`ゆうしゃのHPが${heal}かいふくした！`);
    hero.sp=0;updateSP();
    await enemyAttack();
  }
}

// ==== 入力 ====
function submit(){
  if(locked)return;
  locked=true;
  let v=parseInt(ans.value,10);
  if(Number.isNaN(v)){ locked=false; return; }
  if(v===answer)heroAttack();else enemyAttack();
}
btnOk.onclick=submit;
numpad.onclick=e=>{
  let t=e.target;if(t.tagName!=="BUTTON")return;
  let l=t.textContent;
  if(l==="OK"){submit();return;}
  if(l==="←"){ans.value=ans.value.slice(0,-1);return;}
  if(/^\d$/.test(l)){ans.value+=l;}
}

// ==== 勝敗 ====
async function endBattle(win){
  bgm.pause();
  if(win){
    playSE("se-victory");
    log(`${enemy.name}をたおした！`);

    // 敵の消滅エフェクト
    enemyImg.classList.add("fadeout");
    await wait(1000);

    if(LevelSystem.gainExp(hero)){
      log(`レベルが ${hero.lv} にあがった！`);
      const newSkill=LevelSystem.checkNewSkill(hero.lv);
      if(newSkill)log(`あたらしい とくぎ「${newSkill.name}」をおぼえた！`);
      lvEl.textContent=hero.lv;
    }

    // ★ 魔王撃破時はフェードアウトしてエンディングへ
    if(currentStage === 10){
      const fadeLayer=document.createElement("div");
      fadeLayer.style.position="fixed";
      fadeLayer.style.inset="0";
      fadeLayer.style.background="black";
      fadeLayer.style.opacity="0";
      fadeLayer.style.transition="opacity 1.5s";
      fadeLayer.style.zIndex="9999";
      document.body.appendChild(fadeLayer);

      requestAnimationFrame(()=>{ fadeLayer.style.opacity="1"; });
      setTimeout(()=>{ window.location.href="ending.html"; },1600);
      return;
    }

    resultTitle.textContent="しょうり！";
    resultMsg.textContent="やったね！　つぎへ すすもう！";
    btnNext.style.display="inline-block";
    result.style.display="flex";
  }else{
    playSE("se-defeat");
    retryDialog.style.display="flex";
  }
}

// ==== バトル初期化 ====
async function initBattle(stage){
  const data=StageData[stage];
  if(!data)return;
  enemy={hpMax:data.hp,hp:data.hp,atk:data.atk,def:data.def,name:data.name};
  enemyImg.src=`images/characters/${data.img}`;
  enemyImg.classList.remove("fadeout");
  bgImg.src=`images/backgrounds/${data.bg}`;
  enemyName.textContent=enemy.name;

  introImg.src=`images/characters/${data.img}`;
  introBubble.textContent=enemyLines[stage]?.intro || "";
  intro.classList.remove("hidden");
  hud.classList.add("hidden");
  field.classList.add("hidden");
  panel.classList.add("hidden");

  if(stage===10) bgm.src="music/Demon-King-Battle.mp3";
  else bgm.src="music/battle.mp3";

  hero.hp=hero.hpMax;enemy.hp=enemy.hpMax;hero.sp=0;
  setHP(heroBar,hero.hp,hero.hpMax);setHP(enemyBar,enemy.hp,enemy.hpMax);
  updateSP();lvEl.textContent=hero.lv;

  await wait(2000);
  intro.classList.add("hidden");
  hud.classList.remove("hidden");
  field.classList.remove("hidden");
  panel.classList.remove("hidden");

  playSE("se-encounter");
  await wait(1500);
  bgm.play();
  newQuestion();locked=false;
  hideSkills();
  logEl.innerHTML="";
}

// ==== ステージ進行 ====
btnNext.addEventListener("click", async ()=>{
  result.style.display="none";
  currentStage++;
  if(currentStage>10){
    return;
  }
  const nextData=StageData[currentStage];
  if(hero.lv < nextData.recommendLv){
    warningMsg.textContent=`おすすめレベル ${nextData.recommendLv} にたいして いまのレベルは ${hero.lv} です。どうしますか？`;
    warning.style.display="flex";
    return;
  }
  initBattle(currentStage);
});

// ==== 警告ダイアログ操作 ====
btnRetry.addEventListener("click",()=>{
  warning.style.display="none";
  currentStage--;initBattle(currentStage);
});
btnForce.addEventListener("click",()=>{
  warning.style.display="none";
  initBattle(currentStage);
});

// ==== 敗北ダイアログ操作 ====
btnRetrySame.addEventListener("click",()=>{
  retryDialog.style.display="none";
  initBattle(currentStage);
});
btnRetryPrev.addEventListener("click",()=>{
  retryDialog.style.display="none";
  if(currentStage>1)currentStage--;
  initBattle(currentStage);
});

// ==== スタート ====
window.addEventListener("DOMContentLoaded", async ()=>{
  initBattle(currentStage);
});
