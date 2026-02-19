import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    featureBadges: {
      populate: {
        icon: basicImagePopulate,
      },
    },

    featureLogos: basicImagePopulate,

    ctaCards: {
      populate: {
        icon: basicImagePopulate,
        link: linkPopulate,
      },
    },
  },
}
