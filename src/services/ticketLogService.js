const {
  EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");

function getTicketLogChannel(
  guild,
  settings
) {
  const logChannelId =
    settings.ticket?.logChannelId;

  if (!logChannelId) {
    return null;
  }

  const channel =
    guild.channels.cache.get(
      logChannelId
    );

  if (
    !channel ||
    !channel.isTextBased()
  ) {
    return null;
  }

  return channel;
}


async function sendTicketCloseLog({
  guild,
  settings,
  ticket,
  closedBy,
  channel,
  transcript
}) {
  const logChannel =
    getTicketLogChannel(
      guild,
      settings
    );

  if (!logChannel) {
    console.warn(
      "⚠️ Không tìm thấy Ticket Log Channel."
    );

    return;
  }

  const embed =
    new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle(
        "🔒 Ticket Closed"
      )
      .addFields(
        {
          name: "👤 Chủ Ticket",
          value:
            `<@${ticket.userId}>`,
          inline: true
        },

        {
          name: "🔒 Người đóng",
          value:
            `${closedBy}\n\`${closedBy.id}\``,
          inline: true
        },

        {
          name: "🙋 Claimed By",
          value:
            ticket.claimedBy
              ? `<@${ticket.claimedBy}>`
              : "Chưa Claim",
          inline: true
        },

        {
          name: "📁 Channel",
          value:
            `#${channel.name}\n\`${channel.id}\``,
          inline: true
        },

        {
          name: "📌 Trạng thái",
          value:
            "🔴 Closed",
          inline: true
        }
      )
      .setFooter({
        text:
          `Ticket ID • ${ticket._id}`
      })
      .setTimestamp();

  const fileName =
    `ticket-${ticket.userId}-${channel.id}.txt`;

  const attachment =
    new AttachmentBuilder(
      transcript,
      {
        name: fileName
      }
    );

  await logChannel.send({
    content:
      `📄 **CORGI STUDIO TICKET TRANSCRIPT**\n` +
      `Ticket của <@${ticket.userId}>`,
    embeds: [embed],
    files: [attachment]
  });

  console.log(
    `📄 Transcript đã gửi tới #${logChannel.name}`
  );
}


module.exports = {
  getTicketLogChannel,
  sendTicketCloseLog
};