import linkPopulate from "../utilities/link"

export default {
  populate: {
    reviews: {
      populate: {
        authorAvatar: true,
        logo: true,
        link: linkPopulate,
      },
    },
  },
}
