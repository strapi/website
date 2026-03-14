import sectionHeaderPopulate from "../utilities/section-header"
import featureCardPopulate from "../cards/feature-card"

export default {
  populate: {
    section: sectionHeaderPopulate,
    items: {
      populate: featureCardPopulate.populate,
    },
  },
}
