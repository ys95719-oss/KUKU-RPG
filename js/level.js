// ===============================
// レベルと特技・経験値システム
// ===============================

window.LevelSystem = {
  // --- 必要経験値テーブル ---
  expTable(lv){
    if (lv < 11) return 1;   // 序盤は 1 戦ごとにレベルアップ
    if (lv < 26) return 2;   // 中盤は 2 戦ごと
    if (lv < 41) return 3;   // 後半は 3 戦ごと
    return 5;                // 終盤は 5 戦ごと
  },

  // --- 特技データ ---
  skills: {
    5:  { name:"かえん斬り",       type:"attack", mult:1.5, se:"se-fire",     element:"fire"   },
    8:  { name:"氷の刃",           type:"attack", mult:1.5, se:"se-ice",      element:"ice"    },
    12: { name:"かぜのまい",       type:"attack", mult:1.2, se:"se-wind",     element:"wind"   },
    15: { name:"いやしの光",       type:"heal",   heal:0.3, se:"se-heal"                      },
    20: { name:"いなずま",         type:"attack", mult:2.0, se:"se-thunder",  element:"thunder"},
    25: { name:"まほうの矢",       type:"attack", mult:2.2, se:"se-cosmic",   element:"cosmic" },
    30: { name:"メガスラッシュ",   type:"attack", mult:2.5, se:"se-slash"                  },
    35: { name:"かみなり落とし",   type:"attack", mult:2.8, se:"se-thunder",  element:"thunder"},
    40: { name:"氷嵐",             type:"attack", mult:3.0, se:"se-ice",      element:"ice"    },
    45: { name:"地割れ",           type:"attack", mult:3.0, se:"se-thunder",  element:"earth"  },
    50: { name:"アルティメットバースト", type:"attack", mult:4.0, se:"se-cosmic", element:"cosmic" }
  },

  // --- 指定レベルまでの習得可能特技を取得 ---
  getSkillsForLevel(lv){
    return Object.entries(this.skills)
      .filter(([req]) => lv >= Number(req))
      .map(([_, skill]) => skill);
  },

  // --- 経験値獲得処理 ---
  gainExp(hero){
    hero.exp++;
    if (hero.exp >= this.expTable(hero.lv)) {
      hero.exp = 0;
      hero.lv++;
      this.applyGrowth(hero);
      return true; // レベルアップした
    }
    return false; // レベルアップなし
  },

  // --- ステータス成長 ---
  applyGrowth(hero){
    // HP: +2
    hero.hpMax += 2;
    hero.hp = hero.hpMax;  // レベルアップ時は全回復

    // 攻撃力: 基本 +1、偶数Lvで +2
    if (hero.lv % 2 === 0){
      hero.atk += 2;
    } else {
      hero.atk += 1;
    }

    // 防御力: 基本 +1、5Lvごとに +2
    if (hero.lv % 5 === 0){
      hero.def += 2;
    } else {
      hero.def += 1;
    }
  },

  // --- 新特技の習得チェック ---
  checkNewSkill(lv){
    return this.skills[lv] || null;
  }
};
