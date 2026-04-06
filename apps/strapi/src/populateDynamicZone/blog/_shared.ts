import basicImagePopulate from "../utilities/basic-image"

/**
 * Shared populate config for blog post relations (image, author avatars, category).
 * Used by related-posts, editors-picks, and category-showcase populate configs.
 */
export const blogPostPopulate = {
  populate: {
    image: { populate: { image: basicImagePopulate } },
    author: {
      populate: { avatar: { populate: { image: basicImagePopulate } } },
    },
    coauthors: {
      populate: { avatar: { populate: { image: basicImagePopulate } } },
    },
    category: true,
  },
}
