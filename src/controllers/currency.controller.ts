import { Request, Response } from "express";
import Currency, {
  CurrencyType,
} from "../models/currency.model";

export const getCurrency = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const currency = await Currency.findOne();

    return res.status(200).json({
      success: true,
      data: {
        currency: currency?.currency || "USD",
      },
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to get currency.",
    });
  }
};

export const updateCurrency = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try{

    const { currency } = req.body;

    if (
      typeof currency !== "string" ||
      !["USD", "PKR"].includes(currency.toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Currency must be either USD or PKR.",
      });
    }

    const cleanCurrency =
      currency.toUpperCase() as CurrencyType;


    // Existing currency document ko update karo
    const updatedCurrency =
      await Currency.findOneAndUpdate(
        {},
        {
          $set: {
            currency: cleanCurrency,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

    console.log("UPDATED DOCUMENT:", updatedCurrency);

    if (!updatedCurrency) {
      return res.status(500).json({
        success: false,
        message: "Currency could not be updated.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Currency changed to ${updatedCurrency.currency} successfully.`,
      data: {
        currency: updatedCurrency.currency,
      },
    });
  } catch (error) {
    console.error("Update Currency Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update currency.",
    });
  }
};