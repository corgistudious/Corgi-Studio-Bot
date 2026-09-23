const P = require('../services/progression');
const UI = require('../services/progressionDev');
const { sendDeveloperLog } = require('../services/developerLog');

async function handle(i, client) {
  try {
    /* =========================
       BUTTONS
    ========================= */

    if (i.customId === 'progdev:level:edit')
      return i.showModal(await UI.levelModal());

    if (i.customId === 'progdev:level:advanced')
      return i.showModal(await UI.advancedLevelModal());

    if (i.customId === 'progdev:level:user')
      return i.showModal(UI.userLevelModal());

    if (i.customId === 'progdev:ranking:edit')
      return i.showModal(await UI.rewardModal());

    if (i.customId === 'progdev:ranking:approve') {
      await i.deferReply({ flags: 64 });

      try {
        const b = await P.approveRewards(i.user.id);

        await sendDeveloperLog(client, {
          title: '🏆 Weekly Ranking Rewards Approved',
          description:
            `Developer: ${i.user.id}\n` +
            `Season: ${b.weekKey}\n` +
            `Recipients: ${b.rewards.length}`
        });

        return i.editReply(
          `✅ **${b.weekKey}** rewards sent automatically to ` +
          `**${b.rewards.length}** ranked member(s). ` +
          `Titles expire 7 days from approval.`
        );
      } catch (e) {
        return i.editReply(`❌ ${e.message}`);
      }
    }

    /* =========================
       MODALS
    ========================= */

    if (i.customId === 'progdev:modal:level') {
      await P.updateProgressionConfig({
        xpMin: i.fields.getTextInputValue('xpMin'),
        xpMax: i.fields.getTextInputValue('xpMax'),
        cooldownSeconds: i.fields.getTextInputValue('cooldown'),
        curveBase: i.fields.getTextInputValue('curveBase'),
        curvePower: i.fields.getTextInputValue('curvePower')
      });

      await sendDeveloperLog(client, {
        title: '⚔️ Progression Config Updated',
        description: `Developer: ${i.user.id}`
      });

      return i.reply({
        content: '✅ Global Level & EXP configuration saved.',
        flags: 64
      });
    }

    if (i.customId === 'progdev:modal:userlevel') {
      const uid = i.fields.getTextInputValue('userId').trim();

      if (!/^\d{15,25}$/.test(uid)) {
        return i.reply({
          content: '❌ Invalid Discord User ID.',
          flags: 64
        });
      }

      const p = await P.setUserLevelXp(
        uid,
        i.fields.getTextInputValue('level'),
        i.fields.getTextInputValue('xp')
      );

      await sendDeveloperLog(client, {
        title: '⚔️ User Level/EXP Adjusted',
        description:
          `Developer: ${i.user.id}\n` +
          `User: ${uid}\n` +
          `Level: ${p.level}\n` +
          `EXP: ${p.xp}\n` +
          `Total EXP: ${p.totalXp}`
      });

      return i.reply({
        content:
          `✅ User <@${uid}> set to **Lv.${p.level}** ` +
          `with **${p.xp} EXP**.`,
        flags: 64
      });
    }

    if (i.customId === 'progdev:modal:advancedlevel') {
      await P.updateProgressionConfig({
        maxLevel: i.fields.getTextInputValue('maxLevel'),
        curveDivisor: i.fields.getTextInputValue('curveDivisor')
      });

      return i.reply({
        content: '✅ Advanced Level curve saved.',
        flags: 64
      });
    }

    if (i.customId === 'progdev:modal:rewards') {
      await P.updateRewardConfig({
        top1: i.fields.getTextInputValue('top1'),
        top2: i.fields.getTextInputValue('top2'),
        top3: i.fields.getTextInputValue('top3'),
        top4to10: i.fields.getTextInputValue('top4to10'),
        top11to100: i.fields.getTextInputValue('top11to100')
      });

      return i.reply({
        content: '✅ Weekly Top reward configuration saved.',
        flags: 64
      });
    }

    return false;
  } catch (e) {
    console.error('Progression developer interaction error:', e);

    const payload = {
      content: `❌ ${e.message || 'Developer action failed.'}`,
      flags: 64
    };

    if (i.deferred || i.replied) {
      return i.followUp(payload).catch(() => null);
    }

    return i.reply(payload).catch(() => null);
  }
}

module.exports = { handle };
