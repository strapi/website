import featureCardPopulate from "../cards/feature-card"
import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
    items: {
      populate: featureCardPopulate.populate,
    },
  },
}
