// ending.js  — Demon-King's-Castle.png を安全に表示する修正版
function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

const dialog = document.getElementById("dialog");
const bgDiv   = dialog.querySelector(".bg");
const leftChar = document.getElementById("left-char");
const rightChar = document.getElementById("right-char");
const nameBox = document.getElementById("name");
const textBox = document.getElementById("text");

const narration = document.getElementById("narration");
const narrText  = document.getElementById("narr-text");

const staffroll = document.getElementById("staffroll");
const clearMessage = document.getElementById("clear-message");
const endingBgm = document.getElementById("ending-bgm");

// -------------------------
// 背景セット（ファイル名だけエンコードして安全に読み込む）
// -------------------------
function setBackground(filename){
  // "images/backgrounds/<encoded filename>"
  const url = "images/backgrounds/" + encodeURIComponent(filename);
  bgDiv.style.backgroundImage = `url("${url}")`;
}

// -------------------------
// 会話スクリプト
// -------------------------
const bossLines = [
  { name:"魔王デスロード", text:"ぐぬぬ…　まさか我が力が うちやぶられるとは…" },
  { name:"ゆうしゃ",       text:"九九の力は みんなの力！　もう あなたに あやつらせはしない！" },
  { name:"魔王デスロード", text:"おのれ、ゆうしゃめ……　きさまは ぜったいに ゆるさんぞ！　いずれまた  ふっかつして せかいを しはいしてやる！\nグㇵッ……" }
];

const villageLines = [
  { name:"村長",   text:"よくぞやった！ これで せかいに 九九の力が もどってくる！" },
  { name:"ゆうしゃ", text:"みんなの えがおが もどれば それでいいんです！" },
  { name:"村長",   text:"ありがとう ゆうしゃよ。せかいは ふたたび 平和に なった！" }
];

// ナレーション本文（自動フェード・自動クローズ）
const narr1 = "勇者は村にもどった。";
const narr2 = "こうして世界にはふたたび、九九の力がもどり、\n日々の暮らしに平和が戻りました。\n子どもたちは再び学びと遊びを楽しみ、大人たちは未来へ歩み出しました。";

// -------------------------
// 会話フェーズ（クリックで送り、連打ガード）
// -------------------------
function runDialoguePhase(bgFile, leftImg, rightImg, lines){
  return new Promise(resolve=>{
    setBackground(bgFile);
    leftChar.src  = "images/characters/" + leftImg;
    rightChar.src = "images/characters/" + rightImg;

    dialog.classList.remove("hidden");

    let idx = 0;
    const render = ()=>{
      const cur = lines[idx];
      nameBox.textContent = cur.name;
      textBox.textContent = cur.text;
    };
    render();

    let clickLock = false;
    const onClick = ()=>{
      if (clickLock) return;
      clickLock = true;
      setTimeout(()=>clickLock=false, 120);

      idx++;
      if (idx < lines.length){
        render();
      } else {
        dialog.classList.add("hidden");
        dialog.removeEventListener("click", onClick);
        resolve();
      }
    };

    dialog.addEventListener("click", onClick);
  });
}

// -------------------------
// ナレーション（中央表示 → 自動フェードアウト）
// -------------------------
async function runNarration(text){
  narrText.textContent = text;
  narrText.classList.remove("show"); // リセット
  narration.classList.remove("hidden");

  // 少し待ってからフェードイン（CSS transition）
  await wait(30);
  narrText.classList.add("show");

  // 読ませる時間
  await wait(3200);

  // フェードアウト
  narrText.classList.remove("show");
  await wait(800);

  narration.classList.add("hidden");
}

// -------------------------
// スタッフロール（ロゴ＋「FJサンダースタジオ」）
// -------------------------
function startStaffroll(){
  // 中身を生成してから表示
  staffroll.innerHTML = `
    <p>勇者と失われた九九の力</p>
    <p>制作：シオ・ミキズ</p>
    <p>プログラム：チャッピー　ヨシ・キズミ</p>
    <p>キャラクターデザイン：チャッピー</p>
    <p>音楽：魔王魂</p>
    <p>Special Thanks</p>
    <p>九九をがんばるみんな！</p>
    <p>--------------------</p>
    <p>THE END</p>
    <img src="images/logo.png" alt="FJサンダースタジオ ロゴ" class="logo">
    <p>FJサンダースタジオ</p>
  `;
  staffroll.style.display = "block";

  // スクロール（CSS animation: scroll が staffroll に設定済み）
  staffroll.addEventListener("animationend", ()=>{
    clearMessage.classList.add("show");
  }, { once:true });
}

// -------------------------
// メイン進行
// -------------------------
window.addEventListener("DOMContentLoaded", async ()=>{
  try{ await endingBgm.play(); }catch{}

  // ① 魔王（敗北後）の会話（背景：Demon-King's-Castle.png ※ファイル名に ' を含むのでエンコード必須）
  await runDialoguePhase(`Demon-King's-Castle.png`, "Hero.png", "Demon-King.png", bossLines);

  // ② ナレーション
  await runNarration(narr1);

  // ③ 村長の会話（背景：village.png）
  await runDialoguePhase("village.png", "Hero.png", "village-chief.png", villageLines);

  // ④ ナレーション
  await runNarration(narr2);

  // ⑤ スタッフロール
  startStaffroll();
});
