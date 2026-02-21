import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"
import linkImagePopulate from "../utilities/link-image"
import linkTextPopulate from "../utilities/link-text"

export default {
  populate: {
    logoImage: linkImagePopulate,
    navItems: {
      populate: {
        link: linkTextPopulate,
        sections: {
          populate: {
            items: {
              populate: {
                icon: basicImagePopulate,
                link: linkTextPopulate,
              },
            },
          },
        },
      },
    },
    bottomLinks: linkPopulate,
    ctaLinks: linkPopulate,
  },
}
