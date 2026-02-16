import type { Modules } from "@strapi/strapi"

import planPricingExtraBoxPopulate from "./plan-pricing-extra-box"
import pricingSwitcherPopulate from "./pricing-switcher"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    switcher: pricingSwitcherPopulate,
    cards: {
      populate: {
        link: linkPopulate,
        checkoutModal: {
          fields: [
            "id",
            "planMonthlyPrice",
            "planMonthlyItemPriceId",
            "includedSeats",
            "additionalSeatMonthlyPrice",
            "additionalSeatMonthlyItemPriceId",
            "ssoMonthlyPrice",
            "ssoMonthlyPricePerSeat",
            "ssoMonthlyItemPriceId",
            "ssoDefaultSelected",
            "ssoDescription",
          ],
        },
        sso: {
          fields: ["id", "description", "price", "subtext", "title"],
        },
        promo: {
          fields: ["id", "title", "description", "subtitle"],
        },
        mainFeatures: {
          fields: ["id", "title", "tooltip", "badge", "badgeStyle"],
        },
        starFeatures: {
          fields: ["id", "title", "tooltip", "badge", "badgeStyle"],
        },
        plan: {
          fields: ["id", "name", "type", "price", "yearlyPrice", "subtext"],
          populate: {
            features: {
              populate: {
                feature: {
                  fields: ["id", "name"],
                },
              },
            },
          },
        },
      },
    },
    extraBox: planPricingExtraBoxPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"plans.plan-pricing-cards">
