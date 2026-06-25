import type { Schema, Struct } from "@strapi/strapi"

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: "strapi_api_tokens"
  info: {
    description: ""
    displayName: "Api Token"
    name: "Api Token"
    pluralName: "api-tokens"
    singularName: "api-token"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    adminPermissions: Schema.Attribute.Relation<
      "oneToMany",
      "admin::permission"
    >
    adminUserOwner: Schema.Attribute.Relation<"manyToOne", "admin::user">
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }> &
      Schema.Attribute.DefaultTo<"">
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    expiresAt: Schema.Attribute.DateTime
    kind: Schema.Attribute.Enumeration<["content-api", "admin"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"content-api">
    lastUsedAt: Schema.Attribute.DateTime
    lifespan: Schema.Attribute.BigInteger
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<"oneToMany", "admin::api-token"> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<
      "oneToMany",
      "admin::api-token-permission"
    >
    publishedAt: Schema.Attribute.DateTime
    type: Schema.Attribute.Enumeration<["read-only", "full-access", "custom"]> &
      Schema.Attribute.DefaultTo<"read-only">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: "strapi_api_token_permissions"
  info: {
    description: ""
    displayName: "API Token Permission"
    name: "API Token Permission"
    pluralName: "api-token-permissions"
    singularName: "api-token-permission"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "admin::api-token-permission"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    token: Schema.Attribute.Relation<"manyToOne", "admin::api-token">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: "admin_permissions"
  info: {
    description: ""
    displayName: "Permission"
    name: "Permission"
    pluralName: "permissions"
    singularName: "permission"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    apiToken: Schema.Attribute.Relation<"manyToOne", "admin::api-token">
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<"oneToMany", "admin::permission"> &
      Schema.Attribute.Private
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.Relation<"manyToOne", "admin::role">
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: "admin_roles"
  info: {
    description: ""
    displayName: "Role"
    name: "Role"
    pluralName: "roles"
    singularName: "role"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<"oneToMany", "admin::role"> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<"oneToMany", "admin::permission">
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    users: Schema.Attribute.Relation<"manyToMany", "admin::user">
  }
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: "strapi_sessions"
  info: {
    description: "Session Manager storage"
    displayName: "Session"
    name: "Session"
    pluralName: "sessions"
    singularName: "session"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
    i18n: {
      localized: false
    }
  }
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private
    childId: Schema.Attribute.String & Schema.Attribute.Private
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<"oneToMany", "admin::session"> &
      Schema.Attribute.Private
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique
    status: Schema.Attribute.String & Schema.Attribute.Private
    type: Schema.Attribute.String & Schema.Attribute.Private
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private
  }
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: "strapi_transfer_tokens"
  info: {
    description: ""
    displayName: "Transfer Token"
    name: "Transfer Token"
    pluralName: "transfer-tokens"
    singularName: "transfer-token"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }> &
      Schema.Attribute.DefaultTo<"">
    expiresAt: Schema.Attribute.DateTime
    lastUsedAt: Schema.Attribute.DateTime
    lifespan: Schema.Attribute.BigInteger
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "admin::transfer-token"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<
      "oneToMany",
      "admin::transfer-token-permission"
    >
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: "strapi_transfer_token_permissions"
  info: {
    description: ""
    displayName: "Transfer Token Permission"
    name: "Transfer Token Permission"
    pluralName: "transfer-token-permissions"
    singularName: "transfer-token-permission"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "admin::transfer-token-permission"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    token: Schema.Attribute.Relation<"manyToOne", "admin::transfer-token">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: "admin_users"
  info: {
    description: ""
    displayName: "User"
    name: "User"
    pluralName: "users"
    singularName: "user"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    apiTokens: Schema.Attribute.Relation<"oneToMany", "admin::api-token"> &
      Schema.Attribute.Private
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<"oneToMany", "admin::user"> &
      Schema.Attribute.Private
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    preferedLanguage: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private
    roles: Schema.Attribute.Relation<"manyToMany", "admin::role"> &
      Schema.Attribute.Private
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    username: Schema.Attribute.String
  }
}

export interface ApiBlogCategoryBlogCategory
  extends Struct.CollectionTypeSchema {
  collectionName: "blog_categories"
  info: {
    description: "Blog post categories"
    displayName: "Blog Category"
    pluralName: "blog-categories"
    singularName: "blog-category"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::blog-category.blog-category"
    >
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false
        }
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiBlogPostBlogPost extends Struct.CollectionTypeSchema {
  collectionName: "blog_posts"
  info: {
    description: ""
    displayName: "Blog Post"
    pluralName: "blog-posts"
    singularName: "blog-post"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    author: Schema.Attribute.Relation<
      "manyToOne",
      "plugin::users-permissions.user"
    >
    category: Schema.Attribute.Relation<
      "manyToOne",
      "api::post-category.post-category"
    >
    coauthors: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::users-permissions.user"
    >
    content: Schema.Attribute.RichText
    coverImage: Schema.Attribute.Component<"utilities.basic-image", false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.Text
    image: Schema.Attribute.Component<"media.image", false>
    level: Schema.Attribute.Enumeration<
      ["beginner", "intermediate", "advanced"]
    >
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::blog-post.blog-post"
    > &
      Schema.Attribute.Private
    originalPublishedAt: Schema.Attribute.DateTime
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.DynamicZone<
      [
        "sections.faq-section",
        "sections.how-it-works",
        "sections.section-header",
        "sections.two-columns-benefits",
        "sections.two-column-grid",
        "cards.feature-card",
        "cards.content-card",
        "cards.case-study-card",
        "media.image",
        "media.image-gallery",
        "media.brand-logo-grid",
        "testimonials.quote",
        "forms.newsletter",
        "blog.callout",
        "blog.related-posts",
        "blog.editors-picks",
        "blog.resource-cta",
        "sections.testimonies",
        "sections.meet-the-team",
        "media.video",
        "sections.hero",
        "sections.hero-home",
        "sections.feature-card-grid",
        "forms.hubspot-form",
        "forms.hubspot-form-ssr",
        "forms.conversion",
        "migration.data-sink",
        "media.embed",
        "sections.cta-banner",
        "sections.community-banner",
        "sections.comparator-grid",
        "sections.disclaimer",
        "sections.richtext",
      ]
    >
    seo: Schema.Attribute.Component<"shared.seo", false>
    slug: Schema.Attribute.UID<"title"> & Schema.Attribute.Required
    tags: Schema.Attribute.Relation<"manyToMany", "api::post-tag.post-tag">
    title: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    version: Schema.Attribute.Enumeration<["v3", "v4", "v5"]>
  }
}

export interface ApiBlogTagBlogTag extends Struct.CollectionTypeSchema {
  collectionName: "blog_tags"
  info: {
    description: "Blog post tags"
    displayName: "Blog Tag"
    pluralName: "blog-tags"
    singularName: "blog-tag"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::blog-tag.blog-tag"
    >
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false
        }
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiBlogBlog extends Struct.SingleTypeSchema {
  collectionName: "blogs"
  info: {
    displayName: "Blog"
    pluralName: "blogs"
    singularName: "blog"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<"oneToMany", "api::blog.blog">
    navigation: Schema.Attribute.Component<"blog.navigation", false>
    newsletter: Schema.Attribute.Component<"forms.newsletter", false>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiCaseStudyCategoryCaseStudyCategory
  extends Struct.CollectionTypeSchema {
  collectionName: "case_study_categories"
  info: {
    description: ""
    displayName: "Case Study Category"
    pluralName: "case-study-categories"
    singularName: "case-study-category"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::case-study-category.case-study-category"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<"name">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiCaseStudyCaseStudy extends Struct.CollectionTypeSchema {
  collectionName: "case_studies"
  info: {
    description: "Long-form story showcasing a customer success."
    displayName: "Case Study"
    pluralName: "case-studies"
    singularName: "case-study"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    categories: Schema.Attribute.Relation<
      "oneToMany",
      "api::case-study-category.case-study-category"
    >
    companyName: Schema.Attribute.String
    content: Schema.Attribute.DynamicZone<
      [
        "sections.faq-section",
        "sections.how-it-works",
        "sections.section-header",
        "sections.two-columns-benefits",
        "sections.two-column-grid",
        "cards.feature-card",
        "cards.content-card",
        "cards.case-study-card",
        "media.image",
        "media.image-gallery",
        "media.brand-logo-grid",
        "testimonials.quote",
        "forms.newsletter",
        "sections.testimonies",
        "sections.meet-the-team",
        "media.video",
        "sections.hero",
        "sections.hero-home",
        "sections.feature-card-grid",
        "forms.hubspot-form",
        "forms.hubspot-form-ssr",
        "forms.conversion",
        "migration.data-sink",
        "media.embed",
        "sections.cta-banner",
        "sections.community-banner",
        "sections.comparator-grid",
        "sections.disclaimer",
        "sections.richtext",
      ]
    >
    coverImage: Schema.Attribute.Component<"media.image", false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.Text
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::case-study.case-study"
    > &
      Schema.Attribute.Private
    logoImage: Schema.Attribute.Component<"media.image", false>
    originalPublishedAt: Schema.Attribute.DateTime
    publishedAt: Schema.Attribute.DateTime
    seo: Schema.Attribute.Component<"shared.seo", false>
    slug: Schema.Attribute.UID<"title"> & Schema.Attribute.Required
    title: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiCityCity extends Struct.CollectionTypeSchema {
  collectionName: "cities"
  info: {
    description: ""
    displayName: "City"
    pluralName: "cities"
    singularName: "city"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    country: Schema.Attribute.Relation<"manyToOne", "api::country.country">
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<"oneToMany", "api::city.city"> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<"name">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiCmsComparisonCmsComparison
  extends Struct.CollectionTypeSchema {
  collectionName: "cms_comparisons"
  info: {
    description: ""
    displayName: "CMS Comparison"
    pluralName: "cms-comparisons"
    singularName: "cms-comparison"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    content: Schema.Attribute.DynamicZone<
      [
        "sections.faq-section",
        "sections.how-it-works",
        "sections.section-header",
        "sections.two-columns-benefits",
        "sections.two-column-grid",
        "cards.feature-card",
        "cards.content-card",
        "cards.case-study-card",
        "media.image",
        "media.image-gallery",
        "media.brand-logo-grid",
        "testimonials.quote",
        "forms.newsletter",
        "media.embed",
        "media.video",
        "blog.callout",
        "blog.related-posts",
        "blog.editors-picks",
        "blog.resource-cta",
        "sections.testimonies",
        "sections.meet-the-team",
        "sections.hero",
        "sections.hero-home",
        "sections.feature-card-grid",
        "forms.hubspot-form",
        "forms.hubspot-form-ssr",
        "forms.conversion",
        "migration.data-sink",
        "sections.cta-banner",
        "sections.community-banner",
        "sections.comparator-grid",
        "sections.disclaimer",
        "sections.richtext",
      ]
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.RichText
    label: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::cms-comparison.cms-comparison"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    seo: Schema.Attribute.Component<"shared.seo", false>
    showTable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    slug: Schema.Attribute.UID<"title"> & Schema.Attribute.Required
    title: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiCmsCms extends Struct.CollectionTypeSchema {
  collectionName: "cmses"
  info: {
    description: ""
    displayName: "CMS"
    pluralName: "cmses"
    singularName: "cms"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    content: Schema.Attribute.RichText
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.RichText
    fields: Schema.Attribute.Component<"cms.field-entry", true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<"oneToMany", "api::cms.cms"> &
      Schema.Attribute.Private
    logo: Schema.Attribute.Media<"images">
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.DynamicZone<
      [
        "sections.faq-section",
        "sections.how-it-works",
        "sections.section-header",
        "sections.two-columns-benefits",
        "sections.two-column-grid",
        "cards.feature-card",
        "cards.content-card",
        "cards.case-study-card",
        "media.image",
        "media.image-gallery",
        "media.brand-logo-grid",
        "testimonials.quote",
        "forms.newsletter",
        "sections.testimonies",
        "sections.meet-the-team",
        "media.video",
        "sections.hero",
        "sections.hero-home",
        "sections.feature-card-grid",
        "forms.hubspot-form",
        "forms.hubspot-form-ssr",
        "forms.conversion",
        "migration.data-sink",
        "media.embed",
        "sections.cta-banner",
        "sections.community-banner",
        "sections.comparator-grid",
        "sections.disclaimer",
        "sections.richtext",
      ]
    >
    seo: Schema.Attribute.Component<"shared.seo", false>
    slug: Schema.Attribute.UID<"name">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiCountryCountry extends Struct.CollectionTypeSchema {
  collectionName: "countries"
  info: {
    description: ""
    displayName: "Country"
    pluralName: "countries"
    singularName: "country"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    cities: Schema.Attribute.Relation<"oneToMany", "api::city.city">
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::country.country"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<"name">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiFeatureCategoryFeatureCategory
  extends Struct.CollectionTypeSchema {
  collectionName: "feature_categories"
  info: {
    displayName: "Feature category"
    pluralName: "feature-categories"
    singularName: "feature-category"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    features: Schema.Attribute.Relation<"oneToMany", "api::feature.feature">
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::feature-category.feature-category"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    title: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiFeatureTagFeatureTag extends Struct.CollectionTypeSchema {
  collectionName: "feature_tags"
  info: {
    displayName: "Feature tag"
    pluralName: "feature-tags"
    singularName: "feature-tag"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    features: Schema.Attribute.Relation<"oneToMany", "api::feature.feature">
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::feature-tag.feature-tag"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    title: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiFeatureFeature extends Struct.CollectionTypeSchema {
  collectionName: "features"
  info: {
    displayName: "Feature"
    pluralName: "features"
    singularName: "feature"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.Text
    feature_category: Schema.Attribute.Relation<
      "manyToOne",
      "api::feature-category.feature-category"
    >
    feature_tag: Schema.Attribute.Relation<
      "manyToOne",
      "api::feature-tag.feature-tag"
    >
    icon: Schema.Attribute.Media<"images">
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::feature.feature"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    title: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    url: Schema.Attribute.String
  }
}

export interface ApiFooterFooter extends Struct.SingleTypeSchema {
  collectionName: "footers"
  info: {
    description: ""
    displayName: "Footer"
    pluralName: "footers"
    singularName: "footer"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    content: Schema.Attribute.DynamicZone<
      ["footer.footer-main", "footer.footer-cta"]
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<"oneToMany", "api::footer.footer">
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiGlobalGlobal extends Struct.SingleTypeSchema {
  collectionName: "globals"
  info: {
    description: ""
    displayName: "Global"
    pluralName: "globals"
    singularName: "global"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    defaultSeo: Schema.Attribute.Component<"shared.seo", false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::global.global"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiHeaderHeader extends Struct.SingleTypeSchema {
  collectionName: "headers"
  info: {
    description: ""
    displayName: "Header"
    pluralName: "headers"
    singularName: "header"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    content: Schema.Attribute.DynamicZone<
      ["navigation.top-banner", "navigation.navbar"]
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<"oneToMany", "api::header.header">
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiHubspotFormHubspotForm extends Struct.CollectionTypeSchema {
  collectionName: "hubspot_forms"
  info: {
    displayName: "HubSpot Form"
    pluralName: "hubspot-forms"
    singularName: "hubspot-form"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    formId: Schema.Attribute.String & Schema.Attribute.Required
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::hubspot-form.hubspot-form"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    placeholderHeight: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<300>
    portalId: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiInternalJobInternalJob extends Struct.CollectionTypeSchema {
  collectionName: "internal_jobs"
  info: {
    displayName: "InternalJob"
    pluralName: "internal-jobs"
    singularName: "internal-job"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    documentType: Schema.Attribute.String
    error: Schema.Attribute.String
    jobType: Schema.Attribute.Enumeration<
      ["RECALCULATE_FULLPATH", "CREATE_REDIRECT"]
    > &
      Schema.Attribute.Required
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::internal-job.internal-job"
    > &
      Schema.Attribute.Private
    payload: Schema.Attribute.JSON
    publishedAt: Schema.Attribute.DateTime
    relatedDocumentId: Schema.Attribute.String
    slug: Schema.Attribute.String
    state: Schema.Attribute.Enumeration<["pending", "completed", "failed"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"pending">
    targetLocale: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiNewsItemNewsItem extends Struct.CollectionTypeSchema {
  collectionName: "news_items"
  info: {
    description: ""
    displayName: "News Item"
    pluralName: "news-items"
    singularName: "news-item"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    date: Schema.Attribute.Date
    link: Schema.Attribute.Component<"utilities.link", false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::news-item.news-item"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    thumbnail: Schema.Attribute.Component<"media.image", false>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiNotFoundNotFound extends Struct.SingleTypeSchema {
  collectionName: "not_founds"
  info: {
    description: "Customizable 404 page content"
    displayName: "404 / Not Found"
    pluralName: "not-founds"
    singularName: "not-found"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    backButtonText: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    content: Schema.Attribute.DynamicZone<
      [
        "blog.related-posts",
        "blog.editors-picks",
        "blog.resource-cta",
        "sections.cta-banner",
        "sections.community-banner",
        "sections.section-header",
        "sections.feature-card-grid",
      ]
    > &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    image: Schema.Attribute.Component<"utilities.basic-image", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::not-found.not-found"
    >
    publishedAt: Schema.Attribute.DateTime
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiPagePage extends Struct.CollectionTypeSchema {
  collectionName: "pages"
  info: {
    description: ""
    displayName: "Page"
    pluralName: "pages"
    singularName: "page"
  }
  options: {
    draftAndPublish: true
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    breadcrumbTitle: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    children: Schema.Attribute.Relation<"oneToMany", "api::page.page">
    content: Schema.Attribute.DynamicZone<
      [
        "plans.plan-pricing-cards",
        "plans.plan-comparison-table",
        "sections.faq-section",
        "sections.how-it-works",
        "sections.section-header",
        "sections.two-columns-benefits",
        "sections.two-column-grid",
        "sections.three-column-grid",
        "cards.feature-card",
        "cards.content-card",
        "cards.case-study-card",
        "media.image",
        "media.image-gallery",
        "media.brand-logo-grid",
        "testimonials.quote",
        "forms.newsletter",
        "sections.testimonies",
        "sections.reviews",
        "sections.meet-the-team",
        "media.video",
        "sections.hero",
        "sections.hero-home",
        "sections.feature-card-grid",
        "forms.hubspot-form",
        "forms.hubspot-form-ssr",
        "forms.conversion",
        "forms.demo-conversion",
        "migration.data-sink",
        "media.embed",
        "sections.cta-banner",
        "sections.community-banner",
        "sections.comparator-grid",
        "sections.cookie-declaration",
        "sections.disclaimer",
        "sections.richtext",
        "sections.dynamic-case-studies-grid",
        "sections.dynamic-features-grid",
        "sections.feature-overview",
        "sections.tabbed-feature-overview",
        "sections.news-list",
      ]
    > &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    fullPath: Schema.Attribute.String &
      Schema.Attribute.Unique &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<"oneToMany", "api::page.page">
    minimalLayout: Schema.Attribute.Boolean &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false
        }
      }> &
      Schema.Attribute.DefaultTo<false>
    parent: Schema.Attribute.Relation<"manyToOne", "api::page.page">
    publishedAt: Schema.Attribute.DateTime
    seo: Schema.Attribute.Component<"shared.seo", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiPlanFeaturePlanFeature extends Struct.CollectionTypeSchema {
  collectionName: "plan_features"
  info: {
    displayName: "Plan-Feature"
    pluralName: "plan-features"
    singularName: "plan-feature"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    category: Schema.Attribute.Enumeration<
      ["general", "cloud", "terms-and-services", "usage"]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"general">
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.Text
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::plan-feature.plan-feature"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    order: Schema.Attribute.Integer
    publishedAt: Schema.Attribute.DateTime
    tooltip: Schema.Attribute.Component<"utilities.tooltip", false>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiPlanPlan extends Struct.CollectionTypeSchema {
  collectionName: "plans"
  info: {
    displayName: "Plan"
    pluralName: "plans"
    singularName: "plan"
  }
  options: {
    draftAndPublish: true
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    features: Schema.Attribute.Component<"plans.plan-feature-value", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    locale: Schema.Attribute.String
    localizations: Schema.Attribute.Relation<"oneToMany", "api::plan.plan">
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    price: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    publishedAt: Schema.Attribute.DateTime
    subtext: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    type: Schema.Attribute.Enumeration<["cms", "cloud"]> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    yearlyPrice: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface ApiPostCategoryPostCategory
  extends Struct.CollectionTypeSchema {
  collectionName: "post_categories"
  info: {
    description: ""
    displayName: "Post Category"
    pluralName: "post-categories"
    singularName: "post-category"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    blogPosts: Schema.Attribute.Relation<
      "oneToMany",
      "api::blog-post.blog-post"
    >
    children: Schema.Attribute.Relation<
      "oneToMany",
      "api::post-category.post-category"
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.RichText
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::post-category.post-category"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    parent: Schema.Attribute.Relation<
      "manyToOne",
      "api::post-category.post-category"
    >
    publishedAt: Schema.Attribute.DateTime
    seo: Schema.Attribute.Component<"shared.seo", false>
    slug: Schema.Attribute.UID<"name">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiPostTagPostTag extends Struct.CollectionTypeSchema {
  collectionName: "post_tags"
  info: {
    description: ""
    displayName: "Post Tag"
    pluralName: "post-tags"
    singularName: "post-tag"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    blogPosts: Schema.Attribute.Relation<
      "manyToMany",
      "api::blog-post.blog-post"
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.RichText
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::post-tag.post-tag"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    seo: Schema.Attribute.Component<"shared.seo", false>
    slug: Schema.Attribute.UID<"name"> & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiRedirectRedirect extends Struct.CollectionTypeSchema {
  collectionName: "redirects"
  info: {
    displayName: "Redirect"
    pluralName: "redirects"
    singularName: "redirect"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    destination: Schema.Attribute.String & Schema.Attribute.Required
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::redirect.redirect"
    > &
      Schema.Attribute.Private
    permanent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    publishedAt: Schema.Attribute.DateTime
    source: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiReviewReview extends Struct.CollectionTypeSchema {
  collectionName: "reviews"
  info: {
    description: ""
    displayName: "Review"
    pluralName: "reviews"
    singularName: "review"
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    authorAvatar: Schema.Attribute.Media<"images">
    authorName: Schema.Attribute.String
    authorRole: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    link: Schema.Attribute.Component<"utilities.link", false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::review.review"
    > &
      Schema.Attribute.Private
    logo: Schema.Attribute.Media<"images">
    publishedAt: Schema.Attribute.DateTime
    quote: Schema.Attribute.Text & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface ApiTechStackTechStack extends Struct.CollectionTypeSchema {
  collectionName: "tech_stacks"
  info: {
    description: ""
    displayName: "Tech Stack"
    pluralName: "tech-stacks"
    singularName: "tech-stack"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "api::tech-stack.tech-stack"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<"name">
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: "strapi_releases"
  info: {
    displayName: "Release"
    pluralName: "releases"
    singularName: "release"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    actions: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::content-releases.release-action"
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::content-releases.release"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    releasedAt: Schema.Attribute.DateTime
    scheduledAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<
      ["ready", "blocked", "failed", "done", "empty"]
    > &
      Schema.Attribute.Required
    timezone: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: "strapi_release_actions"
  info: {
    displayName: "Release Action"
    pluralName: "release-actions"
    singularName: "release-action"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    entryDocumentId: Schema.Attribute.String
    isEntryValid: Schema.Attribute.Boolean
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::content-releases.release-action"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    release: Schema.Attribute.Relation<
      "manyToOne",
      "plugin::content-releases.release"
    >
    type: Schema.Attribute.Enumeration<["publish", "unpublish"]> &
      Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: "i18n_locale"
  info: {
    collectionName: "locales"
    description: ""
    displayName: "Locale"
    pluralName: "locales"
    singularName: "locale"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::i18n.locale"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50
          min: 1
        },
        number
      >
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: "strapi_workflows"
  info: {
    description: ""
    displayName: "Workflow"
    name: "Workflow"
    pluralName: "workflows"
    singularName: "workflow"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"[]">
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::review-workflows.workflow"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    stageRequiredToPublish: Schema.Attribute.Relation<
      "oneToOne",
      "plugin::review-workflows.workflow-stage"
    >
    stages: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::review-workflows.workflow-stage"
    >
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: "strapi_workflows_stages"
  info: {
    description: ""
    displayName: "Stages"
    name: "Workflow Stage"
    pluralName: "workflow-stages"
    singularName: "workflow-stage"
  }
  options: {
    draftAndPublish: false
    version: "1.1.0"
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<"#4945FF">
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::review-workflows.workflow-stage"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String
    permissions: Schema.Attribute.Relation<"manyToMany", "admin::permission">
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    workflow: Schema.Attribute.Relation<
      "manyToOne",
      "plugin::review-workflows.workflow"
    >
  }
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: "files"
  info: {
    description: ""
    displayName: "File"
    pluralName: "files"
    singularName: "file"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    alternativeText: Schema.Attribute.Text
    caption: Schema.Attribute.Text
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    ext: Schema.Attribute.String
    focalPoint: Schema.Attribute.JSON
    folder: Schema.Attribute.Relation<"manyToOne", "plugin::upload.folder"> &
      Schema.Attribute.Private
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    formats: Schema.Attribute.JSON
    hash: Schema.Attribute.String & Schema.Attribute.Required
    height: Schema.Attribute.Integer
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::upload.file"
    > &
      Schema.Attribute.Private
    mime: Schema.Attribute.String & Schema.Attribute.Required
    name: Schema.Attribute.String & Schema.Attribute.Required
    previewUrl: Schema.Attribute.Text
    provider: Schema.Attribute.String & Schema.Attribute.Required
    provider_metadata: Schema.Attribute.JSON
    publishedAt: Schema.Attribute.DateTime
    related: Schema.Attribute.Relation<"morphToMany">
    size: Schema.Attribute.Decimal & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    url: Schema.Attribute.Text & Schema.Attribute.Required
    width: Schema.Attribute.Integer
  }
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: "upload_folders"
  info: {
    displayName: "Folder"
    pluralName: "folders"
    singularName: "folder"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    children: Schema.Attribute.Relation<"oneToMany", "plugin::upload.folder">
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    files: Schema.Attribute.Relation<"oneToMany", "plugin::upload.file">
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::upload.folder"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    parent: Schema.Attribute.Relation<"manyToOne", "plugin::upload.folder">
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: "up_permissions"
  info: {
    description: ""
    displayName: "Permission"
    name: "permission"
    pluralName: "permissions"
    singularName: "permission"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::users-permissions.permission"
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.Relation<
      "manyToOne",
      "plugin::users-permissions.role"
    >
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
  }
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: "up_roles"
  info: {
    description: ""
    displayName: "Role"
    name: "role"
    pluralName: "roles"
    singularName: "role"
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    "content-manager": {
      visible: false
    }
    "content-type-builder": {
      visible: false
    }
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::users-permissions.role"
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3
      }>
    permissions: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::users-permissions.permission"
    >
    publishedAt: Schema.Attribute.DateTime
    type: Schema.Attribute.String & Schema.Attribute.Unique
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    users: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::users-permissions.user"
    >
  }
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: "up_users"
  info: {
    displayName: "User"
    name: "User"
    pluralName: "users"
    singularName: "user"
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    avatar: Schema.Attribute.Component<"media.image", false>
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    city: Schema.Attribute.Relation<"manyToOne", "api::city.city">
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    description: Schema.Attribute.Text
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    isTeam: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    job: Schema.Attribute.String
    joinedDate: Schema.Attribute.Date
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      "oneToMany",
      "plugin::users-permissions.user"
    > &
      Schema.Attribute.Private
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    profilePicture: Schema.Attribute.Component<"media.image", false>
    pronouns: Schema.Attribute.String
    provider: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private
    role: Schema.Attribute.Relation<
      "manyToOne",
      "plugin::users-permissions.role"
    >
    slug: Schema.Attribute.UID<"username">
    socials: Schema.Attribute.Component<"utilities.social-link", true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<"oneToOne", "admin::user"> &
      Schema.Attribute.Private
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3
      }>
  }
}

declare module "@strapi/strapi" {
  export module Public {
    export interface ContentTypeSchemas {
      "admin::api-token": AdminApiToken
      "admin::api-token-permission": AdminApiTokenPermission
      "admin::permission": AdminPermission
      "admin::role": AdminRole
      "admin::session": AdminSession
      "admin::transfer-token": AdminTransferToken
      "admin::transfer-token-permission": AdminTransferTokenPermission
      "admin::user": AdminUser
      "api::blog-category.blog-category": ApiBlogCategoryBlogCategory
      "api::blog-post.blog-post": ApiBlogPostBlogPost
      "api::blog-tag.blog-tag": ApiBlogTagBlogTag
      "api::blog.blog": ApiBlogBlog
      "api::case-study-category.case-study-category": ApiCaseStudyCategoryCaseStudyCategory
      "api::case-study.case-study": ApiCaseStudyCaseStudy
      "api::city.city": ApiCityCity
      "api::cms-comparison.cms-comparison": ApiCmsComparisonCmsComparison
      "api::cms.cms": ApiCmsCms
      "api::country.country": ApiCountryCountry
      "api::feature-category.feature-category": ApiFeatureCategoryFeatureCategory
      "api::feature-tag.feature-tag": ApiFeatureTagFeatureTag
      "api::feature.feature": ApiFeatureFeature
      "api::footer.footer": ApiFooterFooter
      "api::global.global": ApiGlobalGlobal
      "api::header.header": ApiHeaderHeader
      "api::hubspot-form.hubspot-form": ApiHubspotFormHubspotForm
      "api::internal-job.internal-job": ApiInternalJobInternalJob
      "api::news-item.news-item": ApiNewsItemNewsItem
      "api::not-found.not-found": ApiNotFoundNotFound
      "api::page.page": ApiPagePage
      "api::plan-feature.plan-feature": ApiPlanFeaturePlanFeature
      "api::plan.plan": ApiPlanPlan
      "api::post-category.post-category": ApiPostCategoryPostCategory
      "api::post-tag.post-tag": ApiPostTagPostTag
      "api::redirect.redirect": ApiRedirectRedirect
      "api::review.review": ApiReviewReview
      "api::tech-stack.tech-stack": ApiTechStackTechStack
      "plugin::content-releases.release": PluginContentReleasesRelease
      "plugin::content-releases.release-action": PluginContentReleasesReleaseAction
      "plugin::i18n.locale": PluginI18NLocale
      "plugin::review-workflows.workflow": PluginReviewWorkflowsWorkflow
      "plugin::review-workflows.workflow-stage": PluginReviewWorkflowsWorkflowStage
      "plugin::upload.file": PluginUploadFile
      "plugin::upload.folder": PluginUploadFolder
      "plugin::users-permissions.permission": PluginUsersPermissionsPermission
      "plugin::users-permissions.role": PluginUsersPermissionsRole
      "plugin::users-permissions.user": PluginUsersPermissionsUser
    }
  }
}
