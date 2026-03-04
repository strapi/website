import type { Modules } from "@strapi/strapi"

import teamMemberItemPopulate from "../elements/team-member-item"
import linkTextPopulate from "../utilities/link-text"
import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
    items: teamMemberItemPopulate,
    ctaLink: linkTextPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.meet-the-team">
