/**
 * ============================================
 * CORGI STUDIO TICKET TRANSCRIPT SERVICE
 * ============================================
 */

/**
 * Lấy toàn bộ tin nhắn trong Ticket.
 * Discord chỉ cho fetch tối đa 100 message/lần,
 * nên phải lấy nhiều lần nếu Ticket dài.
 */
async function fetchAllMessages(channel) {
  const allMessages = [];

  let before;

  while (true) {
    const options = {
      limit: 100
    };

    if (before) {
      options.before = before;
    }

    const messages =
      await channel.messages.fetch(options);

    if (messages.size === 0) {
      break;
    }

    allMessages.push(
      ...messages.values()
    );

    before = messages.last().id;

    if (messages.size < 100) {
      break;
    }
  }

  // Sắp xếp từ tin nhắn cũ → mới
  return allMessages.sort(
    (a, b) =>
      a.createdTimestamp -
      b.createdTimestamp
  );
}


/**
 * Format ngày giờ theo Việt Nam.
 */
function formatDate(date) {
  try {
    return new Intl.DateTimeFormat(
      "vi-VN",
      {
        dateStyle: "medium",
        timeStyle: "medium"
      }
    ).format(date);
  } catch {
    return date.toLocaleString();
  }
}


/**
 * Làm sạch nội dung để transcript dễ đọc.
 */
function cleanText(text) {
  if (!text) {
    return "";
  }

  return text
    .replace(/\r\n/g, "\n")
    .trim();
}


/**
 * Tạo Ticket Transcript.
 */
async function createTicketTranscript(
  channel,
  ticket = null
) {
  const messages =
    await fetchAllMessages(channel);

  const lines = [];

  // ==========================================
  // HEADER
  // ==========================================

  lines.push(
    "============================================================"
  );

  lines.push(
    "                 CORGI STUDIO TICKET TRANSCRIPT"
  );

  lines.push(
    "============================================================"
  );

  lines.push("");

  // ==========================================
  // SERVER INFO
  // ==========================================

  lines.push(
    `Server      : ${channel.guild.name}`
  );

  lines.push(
    `Server ID   : ${channel.guild.id}`
  );

  lines.push(
    `Channel     : #${channel.name}`
  );

  lines.push(
    `Channel ID  : ${channel.id}`
  );

  // ==========================================
  // TICKET INFO
  // ==========================================

  if (ticket) {
    lines.push(
      `Ticket ID   : ${ticket._id}`
    );

    lines.push(
      `User ID     : ${ticket.userId}`
    );

    lines.push(
      `Status      : ${ticket.status}`
    );

    if (ticket.openedAt) {
      lines.push(
        `Opened At   : ${formatDate(
          new Date(ticket.openedAt)
        )}`
      );
    }

    if (ticket.claimedBy) {
      lines.push(
        `Claimed By  : ${ticket.claimedBy}`
      );
    } else {
      lines.push(
        "Claimed By  : Chưa Claim"
      );
    }

    if (ticket.claimedAt) {
      lines.push(
        `Claimed At  : ${formatDate(
          new Date(ticket.claimedAt)
        )}`
      );
    }

    if (ticket.closedBy) {
      lines.push(
        `Closed By   : ${ticket.closedBy}`
      );
    }

    if (ticket.closedAt) {
      lines.push(
        `Closed At   : ${formatDate(
          new Date(ticket.closedAt)
        )}`
      );
    }
  }

  lines.push(
    `Transcript  : ${formatDate(
      new Date()
    )}`
  );

  lines.push("");

  lines.push(
    "------------------------------------------------------------"
  );

  lines.push(
    "                        MESSAGE HISTORY"
  );

  lines.push(
    "------------------------------------------------------------"
  );

  lines.push("");

  // ==========================================
  // KHÔNG CÓ MESSAGE
  // ==========================================

  if (messages.length === 0) {
    lines.push(
      "[Ticket không có tin nhắn]"
    );

    lines.push("");
  }

  // ==========================================
  // MESSAGE HISTORY
  // ==========================================

  for (const message of messages) {
    const createdAt =
      formatDate(
        new Date(
          message.createdTimestamp
        )
      );

    const authorName =
      message.author.globalName ||
      message.author.username;

    const authorTag =
      message.author.tag ||
      message.author.username;

    lines.push(
      `[${createdAt}]`
    );

    lines.push(
      `${authorName} (${authorTag})`
    );

    lines.push(
      `User ID: ${message.author.id}`
    );

    if (message.author.bot) {
      lines.push(
        "Account: BOT"
      );
    } else {
      lines.push(
        "Account: USER"
      );
    }

    // ========================================
    // NỘI DUNG MESSAGE
    // ========================================

    const content =
      cleanText(message.content);

    if (content) {
      lines.push("");
      lines.push(content);
    }

    // ========================================
    // REPLY
    // ========================================

    if (message.reference?.messageId) {
      lines.push("");

      lines.push(
        `↪ Reply To Message ID: ${message.reference.messageId}`
      );
    }

    // ========================================
    // ATTACHMENTS
    // ========================================

    if (
      message.attachments.size > 0
    ) {
      lines.push("");
      lines.push("📎 Attachments:");

      for (
        const attachment
        of message.attachments.values()
      ) {
        lines.push(
          `- Name: ${
            attachment.name ||
            "Unknown File"
          }`
        );

        if (attachment.contentType) {
          lines.push(
            `  Type: ${attachment.contentType}`
          );
        }

        if (attachment.size) {
          lines.push(
            `  Size: ${attachment.size} bytes`
          );
        }

        lines.push(
          `  URL: ${attachment.url}`
        );
      }
    }

    // ========================================
    // EMBEDS
    // ========================================

    if (message.embeds.length > 0) {
      lines.push("");

      lines.push(
        `📦 Embeds: ${message.embeds.length}`
      );

      for (
        const [index, embed]
        of message.embeds.entries()
      ) {
        lines.push("");
        lines.push(
          `  Embed ${index + 1}`
        );

        if (embed.title) {
          lines.push(
            `  Title: ${embed.title}`
          );
        }

        if (embed.description) {
          lines.push(
            `  Description: ${cleanText(
              embed.description
            )}`
          );
        }

        if (
          embed.fields &&
          embed.fields.length > 0
        ) {
          for (
            const field
            of embed.fields
          ) {
            lines.push(
              `  ${field.name}: ${field.value}`
            );
          }
        }

        if (embed.url) {
          lines.push(
            `  URL: ${embed.url}`
          );
        }
      }
    }

    // ========================================
    // STICKERS
    // ========================================

    if (message.stickers.size > 0) {
      lines.push("");
      lines.push("🏷 Stickers:");

      for (
        const sticker
        of message.stickers.values()
      ) {
        lines.push(
          `- ${sticker.name}`
        );
      }
    }

    // ========================================
    // REACTIONS
    // ========================================

    if (
      message.reactions.cache.size > 0
    ) {
      lines.push("");
      lines.push("😀 Reactions:");

      for (
        const reaction
        of message.reactions.cache.values()
      ) {
        lines.push(
          `- ${reaction.emoji} x${reaction.count}`
        );
      }
    }

    lines.push("");

    lines.push(
      `Message ID: ${message.id}`
    );

    lines.push("");

    lines.push(
      "------------------------------------------------------------"
    );

    lines.push("");
  }

  // ==========================================
  // FOOTER
  // ==========================================

  lines.push(
    "============================================================"
  );

  lines.push(
    "                    END OF TRANSCRIPT"
  );

  lines.push(
    "                  Corgi Studio Support"
  );

  lines.push(
    "============================================================"
  );

  return Buffer.from(
    lines.join("\n"),
    "utf8"
  );
}


module.exports = {
  fetchAllMessages,
  createTicketTranscript
};