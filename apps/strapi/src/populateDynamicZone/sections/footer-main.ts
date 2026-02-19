import basicImagePopulate from "../utilities/basic-image"
import linkImagePopulate from "../utilities/link-image"
import linkTextPopulate from "../utilities/link-text"

export default {
  populate: {
    logoImage: linkImagePopulate,

    sections: {
      populate: {
        links: linkTextPopulate,
      },
    },

    links: linkTextPopulate,

    socials: {
      populate: {
        socials: {
          populate: {
            image: basicImagePopulate,
            page: {
              fields: ["fullPath"] as unknown as any,
            },
          },
        },
      },
    },
  },
}
