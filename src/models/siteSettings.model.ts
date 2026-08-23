import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export interface ISiteSettings extends Document {
  siteName: string;
  favicon: string;

  primaryColor: string;
  secondaryColor: string;

  backgroundColor: string;
  cardColor: string;

  textColor: string;
  mutedTextColor: string;

  buttonColor: string;
  buttonTextColor: string;
  buttonHoverColor: string;

  borderColor: string;

  sidebarColor: string;
  headerColor: string;

  accentColor: string;

  gradientStart: string;
  gradientEnd: string;

  gridColumns: number;
  borderRadius: string;

  /*
  ============================================================
  DASHBOARD CARD ICON COLORS
  ============================================================
  */

  dashboardCardColors: {
    deposit: string;
    withdraw: string;
    task: string;
    team: string;
    plan: string;
    support: string;
    youtube: string;
    income: string;
  };
}

const SiteSettingsSchema =
  new Schema<ISiteSettings>(
    {
      /*
      ========================================================
      BRAND
      ========================================================
      */

      siteName: {
        type: String,
        default: "My Platform",
        trim: true,
      },

      favicon: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      ========================================================
      MAIN COLORS
      ========================================================
      */

      primaryColor: {
        type: String,
        default: "#000000",
      },

      secondaryColor: {
        type: String,
        default: "#6B7280",
      },

      backgroundColor: {
        type: String,
        default: "#F9FAFB",
      },

      cardColor: {
        type: String,
        default: "#FFFFFF",
      },

      textColor: {
        type: String,
        default: "#111827",
      },

      mutedTextColor: {
        type: String,
        default: "#6B7280",
      },

      /*
      ========================================================
      BUTTON
      ========================================================
      */

      buttonColor: {
        type: String,
        default: "#000000",
      },

      buttonTextColor: {
        type: String,
        default: "#FFFFFF",
      },

      buttonHoverColor: {
        type: String,
        default: "#222222",
      },

      /*
      ========================================================
      BORDER
      ========================================================
      */

      borderColor: {
        type: String,
        default: "#E5E7EB",
      },

      /*
      ========================================================
      SIDEBAR / HEADER
      ========================================================
      */

      sidebarColor: {
        type: String,
        default: "#000000",
      },

      headerColor: {
        type: String,
        default: "#FFFFFF",
      },

      /*
      ========================================================
      ACCENT
      ========================================================
      */

      accentColor: {
        type: String,
        default: "#7C60F4",
      },

      /*
      ========================================================
      GRADIENT
      ========================================================
      */

      gradientStart: {
        type: String,
        default: "#7C60F4",
      },

      gradientEnd: {
        type: String,
        default: "#E749A0",
      },

      /*
      ========================================================
      LAYOUT
      ========================================================
      */

      gridColumns: {
        type: Number,
        default: 3,
        min: 1,
        max: 6,
      },

      borderRadius: {
        type: String,
        default: "12px",
      },

      /*
      ========================================================
      DASHBOARD CARD ICON COLORS
      ========================================================
      */

      dashboardCardColors: {
        deposit: {
          type: String,
          default: "#EEC835",
        },

        withdraw: {
          type: String,
          default: "#229CC1",
        },

        task: {
          type: String,
          default: "#721CAB",
        },

        team: {
          type: String,
          default: "#00B46A",
        },

        plan: {
          type: String,
          default: "#188BF7",
        },

        support: {
          type: String,
          default: "#19DD9C",
        },

        youtube: {
          type: String,
          default: "#EB212B",
        },

        income: {
          type: String,
          default: "#1C48C2",
        },
      },
    },
    {
      timestamps: true,
    }
  );

/*
============================================================
MODEL
============================================================
*/

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>(
    "SiteSettings",
    SiteSettingsSchema
  );

export default SiteSettings;