import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface ISupportItem {
  title: string;
  description: string;
  link: string;
  buttonText: string;
  enabled: boolean;
}

export interface ISupport extends Document {
  title: string;
  description: string;

  telegram: ISupportItem;
  whatsapp: ISupportItem;
  email: ISupportItem;
  whatsappGroup: ISupportItem;

  createdAt: Date;
  updatedAt: Date;
}

const supportItemSchema =
  new Schema<ISupportItem>(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      link: {
        type: String,
        default: "",
        trim: true,
      },

      buttonText: {
        type: String,
        required: true,
        trim: true,
      },

      enabled: {
        type: Boolean,
        default: true,
      },
    },
    {
      _id: false,
    }
  );

const supportSchema =
  new Schema<ISupport>(
    {
      title: {
        type: String,
        default: "Customer Support",
        trim: true,
      },

      description: {
        type: String,
        default:
          "Need help? Our support team is available 24/7 to assist you with Recharge, Withdrawal, Account and Technical Issues.",
        trim: true,
      },

      telegram: {
        type: supportItemSchema,
        default: {
          title: "Telegram Support",
          description:
            "Fast response within minutes",
          link: "",
          buttonText: "Chat",
          enabled: true,
        },
      },

      whatsapp: {
        type: supportItemSchema,
        default: {
          title: "WhatsApp Support",
          description:
            "Direct customer assistance",
          link: "",
          buttonText: "Chat",
          enabled: true,
        },
      },

      email: {
        type: supportItemSchema,
        default: {
          title: "Email Support",
          description:
            "For business & account issues",
          link: "",
          buttonText: "Send",
          enabled: true,
        },
      },

      whatsappGroup: {
        type: supportItemSchema,
        default: {
          title: "WhatsApp Group",
          description:
            "Join our official community for updates",
          link: "",
          buttonText: "Join",
          enabled: true,
        },
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<ISupport>(
  "Support",
  supportSchema
);