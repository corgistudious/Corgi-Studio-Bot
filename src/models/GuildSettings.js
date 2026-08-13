const mongoose = require("mongoose");

const guildSettingsSchema =
  new mongoose.Schema(
    {
      guildId: {
        type: String,
        required: true,
        unique: true,
        index: true
      },

      // =====================================
      // GENERAL
      // =====================================
      general: {
        language: {
          type: String,
          default: "vi"
        },

        botName: {
          type: String,
          default: "Corgi Studio"
        }
      },

      // =====================================
      // WELCOME
      // =====================================
      welcome: {
        enabled: {
          type: Boolean,
          default: false
        },

        channelId: {
          type: String,
          default: null
        },

        message: {
          type: String,
          default:
            "Chào mừng {user} đến với {server}! 🎉"
        }
      },

      // =====================================
      // AUTO ROLE
      // =====================================
      autoRole: {
        enabled: {
          type: Boolean,
          default: false
        },

        roleId: {
          type: String,
          default: null
        }
      },

      // =====================================
      // TICKET
      // =====================================
      ticket: {
        enabled: {
          type: Boolean,
          default: false
        },

        categoryId: {
          type: String,
          default: null
        },

        staffRoleId: {
          type: String,
          default: null
        },

        logChannelId: {
          type: String,
          default: null
        },

        panelChannelId: {
          type: String,
          default: null
        },

        panel: {
          title: {
            type: String,
            default:
              "🎫 Corgi Studio — Trung Tâm Hỗ Trợ"
          },

          description: {
            type: String,
            default:
              "Bạn đang cần hỗ trợ từ đội ngũ **Corgi Studio**?\n\n" +
              "Nhấn nút **🎫 Mở Ticket** bên dưới để tạo một kênh hỗ trợ riêng."
          },

          privateText: {
            type: String,
            default:
              "Ticket chỉ hiển thị cho bạn và đội ngũ hỗ trợ."
          },

          staffText: {
            type: String,
            default:
              "Đội ngũ Staff sẽ hỗ trợ bạn trong Ticket."
          },

          warningText: {
            type: String,
            default:
              "Không tạo Ticket spam hoặc khi không cần thiết."
          },

          buttonLabel: {
            type: String,
            default:
              "Mở Ticket"
          }
        }
      },

      // =====================================
      // XP & LEVEL
      // =====================================
      leveling: {
        enabled: {
          type: Boolean,
          default: true
        },

        xpMin: {
          type: Number,
          default: 15
        },

        xpMax: {
          type: Number,
          default: 25
        },

        cooldown: {
          type: Number,
          default: 60
        },

        levelUpChannelId: {
          type: String,
          default: null
        },

        levelRoles: [
          {
            level: {
              type: Number,
              required: true,
              min: 1
            },

            roleId: {
              type: String,
              required: true
            }
          }
        ],

        managedLevelRoleIds: {
          type: [String],
          default: []
        }
      },

      // =====================================
      // LOGS
      // =====================================
      logs: {
        enabled: {
          type: Boolean,
          default: false
        },

        channelId: {
          type: String,
          default: null
        }
      },

      // =====================================
      // MODERATION & ANTI SPAM
      // =====================================
      moderation: {
        // =====================================
        // MOD LOG CHANNEL
        // =====================================
        logChannelId: {
          type: String,
          default: null
        },

        // =====================================
        // MUTE ROLE
        // =====================================
        muteRoleId: {
          type: String,
          default: null
        },

        // =====================================
        // ANTI SPAM
        // =====================================
        antiSpam: {
          enabled: {
            type: Boolean,
            default: false
          },

          // Số tin nhắn tối đa trong
          // khoảng thời gian intervalSeconds
          maxMessages: {
            type: Number,
            default: 5,
            min: 2,
            max: 50
          },

          // Khoảng thời gian kiểm tra spam
          intervalSeconds: {
            type: Number,
            default: 5,
            min: 1,
            max: 60
          },

          // Thời gian timeout khi phát hiện spam
          timeoutSeconds: {
            type: Number,
            default: 60,
            min: 5,
            max: 2419200
          },

          // Role được bỏ qua Anti Spam
          ignoredRoleId: {
            type: String,
            default: null
          },

          // Channel được bỏ qua Anti Spam
          ignoredChannelId: {
            type: String,
            default: null
          }
        }
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "GuildSettings",
    guildSettingsSchema
  );