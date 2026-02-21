import { errors } from "@strapi/utils"

import {
  createComponentsPopulateObject,
  getComponentsToPopulate,
  normalizeDynamicZonePopulate,
} from "./helpers"

const supportedActions = new Set(["findMany", "findOne", "findFirst"])

/**
 * Strapi Documents API middleware that enables dynamic population of components inside dynamic zones via the `populateDynamicZone` request parameter.
 *
 * When `populateDynamicZone` is present, the middleware:
 * - validates that requested attributes exist on the content type
 * - prefetches data to detect which components are actually used
 * - automatically builds an optimal `populate` configuration for those components
 *
 * This allows clients to request fully populated dynamic zone content without manually defining deep populate trees, while significantly improving performance.
 */

export const registerDynamicZonePopulateMiddleware = ({ strapi }) => {
  strapi.documents.use(async (context, next) => {
    if (!supportedActions.has(context.action)) {
      return next()
    }

    const dynamicZonePopulate = normalizeDynamicZonePopulate(
      context.params?.populateDynamicZone
    )

    const isDynamicZonePopulateEnabled = dynamicZonePopulate.length > 0

    if (!isDynamicZonePopulateEnabled) {
      return next()
    }

    const attributesNotExists = dynamicZonePopulate.filter(
      (populateAttr) =>
        context.contentType.attributes[populateAttr] === undefined
    )

    if (attributesNotExists.length > 0) {
      throw new errors.ValidationError(
        `Attributes '${attributesNotExists.join(", ")}' do not exist`
      )
    }

    delete context.params.populateDynamicZone

    const componentsToPopulate = await getComponentsToPopulate(
      dynamicZonePopulate,
      context
    )

    const componentsPopulateObject =
      createComponentsPopulateObject(componentsToPopulate)

    context.params.populate = {
      ...context.params.populate,
      ...componentsPopulateObject,
    }

    return next()
  })
}
