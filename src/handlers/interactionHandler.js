const {
  Events,
  MessageFlags
} = require("discord.js");

// =====================================
// DYNAMIC BUTTONS
// =====================================

const DYNAMIC_BUTTONS = [
  // =====================================
  // XP & LEVEL
  // =====================================
  {
    prefix: "xp_add_",
    handler: "xp_add"
  },
  {
    prefix: "xp_remove_",
    handler: "xp_remove"
  },
  {
    prefix: "xp_set_",
    handler: "xp_set"
  },
  {
    prefix: "level_set_",
    handler: "level_set"
  },
  {
    prefix: "xp_reset_",
    handler: "xp_reset"
  },

  // =====================================
  // DEVELOPER AUDIT
  // =====================================
  {
    prefix: "dev_audit_page:",
    handler: "dev_audit_page"
  },

  // =====================================
  // EVENT CONTEST
  // =====================================
  {
    prefix: "contest_announce:",
    handler: "contest_announce"
  },
  {
    prefix: "contest_submissions_manage:",
    handler: "contest_submissions_manage"
  },
  {
    prefix: "contest_refresh:",
    handler: "contest_refresh"
  },
  {
    prefix: "contest_open_vote:",
    handler: "contest_open_vote"
  },
  {
    prefix: "contest_end:",
    handler: "contest_end"
  },

  // =====================================
  // PUBLISH RESULTS
  // =====================================
  {
    prefix: "contest_publish_results:",
    handler: "contest_publish_results"
  },

  // =====================================
  // CONTEST DELETE
  // confirm phải đứng trước delete
  // =====================================
  {
    prefix: "contest_delete_confirm:",
    handler: "contest_delete_confirm"
  },
  {
    prefix: "contest_delete:",
    handler: "contest_delete"
  },

  // =====================================
  // MEMBER SUBMIT
  // =====================================
  {
    prefix: "contest_submit:",
    handler: "contest_submit"
  },

  // =====================================
  // SUBMISSION MODERATION
  // =====================================
  {
    prefix: "contest_submission_approve:",
    handler: "contest_submission_approve"
  },
  {
    prefix: "contest_submission_reject:",
    handler: "contest_submission_reject"
  },
  {
    prefix: "contest_submission_skip:",
    handler: "contest_submission_skip"
  },

  // =====================================
  // CONTEST VOTE
  // =====================================
  {
    prefix: "contest_vote:",
    handler: "contest_vote"
  }
];

// =====================================
// DYNAMIC SELECT MENUS
// =====================================

const DYNAMIC_SELECT_MENUS = [
  // =====================================
  // CONTEST CHANNEL CONFIG
  // =====================================
  {
    prefix: "contest_channel_event:",
    handler: "contest_channel_event"
  },
  {
    prefix: "contest_channel_gallery:",
    handler: "contest_channel_gallery"
  },
  {
    prefix: "contest_channel_result:",
    handler: "contest_channel_result"
  }
];

// =====================================
// DYNAMIC MODALS
// =====================================

const DYNAMIC_MODALS = [
  // =====================================
  // XP & LEVEL
  // =====================================
  {
    prefix: "xp_add_modal_",
    handler: "xp_add_modal"
  },
  {
    prefix: "xp_remove_modal_",
    handler: "xp_remove_modal"
  },
  {
    prefix: "xp_set_modal_",
    handler: "xp_set_modal"
  },
  {
    prefix: "level_set_modal_",
    handler: "level_set_modal"
  },

  // =====================================
  // CONTEST SUBMIT
  // =====================================
  {
    prefix: "contest_submit_modal:",
    handler: "contest_submit_modal"
  },

  // =====================================
  // CONTEST REJECT
  // =====================================
  {
    prefix: "contest_submission_reject_modal:",
    handler: "contest_submission_reject_modal"
  }
];

// =====================================
// FIND DYNAMIC COMPONENT
// =====================================

function findDynamicComponent(
  collection,
  customId,
  mappings
) {
  for (const item of mappings) {
    if (
      customId.startsWith(
        item.prefix
      )
    ) {
      return collection?.get(
        item.handler
      );
    }
  }

  return null;
}

// =====================================
// SAFE ERROR RESPONSE
// =====================================

async function sendInteractionError(
  interaction
) {
  try {
    // =====================================
    // ALREADY ACKNOWLEDGED
    // =====================================

    if (
      interaction.replied ||
      interaction.deferred
    ) {
      if (
        interaction.deferred &&
        !interaction.replied
      ) {
        await interaction.editReply({
          content:
            "❌ Đã xảy ra lỗi khi xử lý thao tác này.",
          embeds: [],
          components: []
        });

        return;
      }

      return;
    }

    // =====================================
    // NORMAL ERROR
    // =====================================

    await interaction.reply({
      content:
        "❌ Đã xảy ra lỗi khi xử lý thao tác này.",
      flags:
        MessageFlags.Ephemeral
    });
  } catch (replyError) {
    // Unknown Interaction
    if (
      replyError?.code === 10062
    ) {
      return;
    }

    // Interaction already acknowledged
    if (
      replyError?.code === 40060
    ) {
      return;
    }

    console.error(
      "❌ Không thể gửi thông báo lỗi:",
      replyError
    );
  }
}

// =====================================
// INTERACTION HANDLER
// =====================================

function loadInteractionHandler(
  client
) {
  client.on(
    Events.InteractionCreate,

    async (interaction) => {
      try {
        // =====================================
        // SLASH COMMAND
        // =====================================

        if (
          interaction.isChatInputCommand()
        ) {
          const command =
            client.commands?.get(
              interaction.commandName
            );

          if (!command) {
            console.warn(
              `⚠️ Không tìm thấy Command: /${interaction.commandName}`
            );

            return;
          }

          console.log(
            `⚡ ${interaction.user.tag} sử dụng /${interaction.commandName}`
          );

          await command.execute(
            interaction
          );

          return;
        }

        // =====================================
        // BUTTON
        // =====================================

        if (
          interaction.isButton()
        ) {
          // Static button trước
          let button =
            client.buttons?.get(
              interaction.customId
            );

          // Dynamic button
          if (!button) {
            button =
              findDynamicComponent(
                client.buttons,
                interaction.customId,
                DYNAMIC_BUTTONS
              );
          }

          if (!button) {
            console.warn(
              `⚠️ Không tìm thấy Button: ${interaction.customId}`
            );

            return;
          }

          console.log(
            `🔘 Button: ${interaction.customId}`
          );

          await button.execute(
            interaction
          );

          return;
        }

        // =====================================
        // SELECT MENU
        // =====================================

        if (
          interaction.isStringSelectMenu() ||
          interaction.isChannelSelectMenu() ||
          interaction.isRoleSelectMenu() ||
          interaction.isUserSelectMenu()
        ) {
          // Static Select Menu trước
          let menu =
            client.selectMenus?.get(
              interaction.customId
            );

          // Dynamic Select Menu
          if (!menu) {
            menu =
              findDynamicComponent(
                client.selectMenus,
                interaction.customId,
                DYNAMIC_SELECT_MENUS
              );
          }

          if (!menu) {
            console.warn(
              `⚠️ Không tìm thấy Select Menu: ${interaction.customId}`
            );

            return;
          }

          console.log(
            `📋 Select Menu: ${interaction.customId}`
          );

          await menu.execute(
            interaction
          );

          return;
        }

        // =====================================
        // MODAL
        // =====================================

        if (
          interaction.isModalSubmit()
        ) {
          // Static Modal trước
          let modal =
            client.modals?.get(
              interaction.customId
            );

          // Dynamic Modal
          if (!modal) {
            modal =
              findDynamicComponent(
                client.modals,
                interaction.customId,
                DYNAMIC_MODALS
              );
          }

          if (!modal) {
            console.warn(
              `⚠️ Không tìm thấy Modal: ${interaction.customId}`
            );

            return;
          }

          console.log(
            `📝 Modal: ${interaction.customId}`
          );

          await modal.execute(
            interaction
          );

          return;
        }
      } catch (error) {
        console.error(
          "❌ Interaction Error:",
          error
        );

        // Discord Unknown Interaction
        if (
          error?.code === 10062
        ) {
          return;
        }

        // Interaction already acknowledged
        if (
          error?.code === 40060
        ) {
          return;
        }

        await sendInteractionError(
          interaction
        );
      }
    }
  );

  console.log(
    "✅ Interaction Handler đã sẵn sàng."
  );
}

// =====================================
// EXPORT
// =====================================

module.exports =
  loadInteractionHandler;