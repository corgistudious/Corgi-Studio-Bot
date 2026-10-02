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
