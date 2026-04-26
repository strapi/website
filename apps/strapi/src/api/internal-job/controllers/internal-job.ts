/**
 * internal-job controller
 */

import { factories } from "@strapi/strapi"

import { validateAdminToken } from "../../../utils/validate-admin-token"

export default factories.createCoreController(
  "api::internal-job.internal-job",
  ({ strapi }) => ({
    runRecalculateFullpathAll: async (ctx) => {
      const headers = ctx.request.headers
      const validationResult = validateAdminToken(strapi, headers)

      if (validationResult.valid === false) {
        return ctx.forbidden(validationResult.error)
      }

      const result = await strapi
        .service("api::internal-job.internal-job")
        .runAll("RECALCULATE_FULLPATH")

      return result
    },

    runCreateRedirectsAll: async (ctx) => {
      const headers = ctx.request.headers

      const validationResult = validateAdminToken(strapi, headers)

      if (validationResult.valid === false) {
        return ctx.forbidden(validationResult.error)
      }

      const result = await strapi
        .service("api::internal-job.internal-job")
        .runAll("CREATE_REDIRECT")

      return result
    },
  })
)
