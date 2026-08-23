import { Request, Response } from "express";
import Support from "../models/support.model";

/*
============================================================
GET SUPPORT
PUBLIC
============================================================
*/

export const getSupport = async (
  req: Request,
  res: Response
) => {
  try {
    let support = await Support.findOne();

    /*
    --------------------------------------------------------
    Agar database mein record nahi hai to default record
    create kar do.
    --------------------------------------------------------
    */

    if (!support) {
      support = await Support.create({});
    }

    return res.status(200).json({
      success: true,
      data: support,
    });
  } catch (error) {
    console.error(
      "Get Support Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get support settings.",
    });
  }
};

/*
============================================================
UPDATE SUPPORT
ADMIN
============================================================
*/

export const updateSupport = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      description,
      telegram,
      whatsapp,
      email,
      whatsappGroup,
    } = req.body;

    const support =
      await Support.findOneAndUpdate(
        {},
        {
          $set: {
            ...(title !== undefined && {
              title,
            }),

            ...(description !== undefined && {
              description,
            }),

            ...(telegram !== undefined && {
              telegram,
            }),

            ...(whatsapp !== undefined && {
              whatsapp,
            }),

            ...(email !== undefined && {
              email,
            }),

            ...(whatsappGroup !== undefined && {
              whatsappGroup,
            }),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Support settings updated successfully.",
      data: support,
    });
  } catch (error) {
    console.error(
      "Update Support Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update support settings.",
    });
  }
};