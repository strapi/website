# V4 Component Schema Reference

Extracted from `/website-2020/strapi-admin/src/components/`.
Only includes components referenced in migration mappings.

## Slices (dynamic zone components)

### slices.hero-dark

| Field      | Type      | Nested      |
| ---------- | --------- | ----------- |
| hero       | component | shared.hero |
| youtubeUrl | string    | —           |

### slices.side-hero-with-image

| Field           | Type        | Nested       |
| --------------- | ----------- | ------------ |
| upperTitle      | string      | —            |
| title           | string      | —            |
| description     | text        | —            |
| image           | component   | media.image  |
| primaryButton   | component   | links.button |
| secondaryButton | component   | links.button |
| features        | component[] | shared.card  |
| whiteCards      | component[] | shared.card  |
| logos           | component[] | —            |
| isHero          | boolean     | —            |

### slices.faq

| Field          | Type        | Nested                      |
| -------------- | ----------- | --------------------------- |
| gradientHeader | component   | shared.gradient-header      |
| intro          | component   | text.label-title-text-links |
| categories     | component[] | shared.faq-category         |

### slices.stepper

| Field           | Type        | Nested                      |
| --------------- | ----------- | --------------------------- |
| gradientHeader  | component   | shared.gradient-header      |
| intro           | component   | text.label-title-text-links |
| step            | component[] | shared.step                 |
| backgroundImage | component   | media.image                 |

### slices.two-columns-benefits

| Field       | Type        | Nested      |
| ----------- | ----------- | ----------- |
| upperTitle  | string      | —           |
| title       | string      | —           |
| description | text        | —           |
| benefits    | component[] | shared.card |

### slices.features-grid

| Field       | Type        | Nested              |
| ----------- | ----------- | ------------------- |
| upperTitle  | string      | —                   |
| title       | string      | —                   |
| description | string      | —                   |
| cards       | component[] | shared.feature-card |

### slices.team-slice

| Field            | Type      | Nested                      |
| ---------------- | --------- | --------------------------- |
| intro            | component | text.label-title-text-links |
| openPositionsCTA | component | shared.open-positions-cta   |

### slices.testimonies

| Field      | Type        | Nested                 |
| ---------- | ----------- | ---------------------- |
| thumbnails | component[] | slices.video-thumbnail |

### slices.features-card

| Field      | Type        | Nested               |
| ---------- | ----------- | -------------------- |
| leftTitle  | string      | —                    |
| text       | text        | —                    |
| link       | component   | links.link           |
| features   | component[] | shared.star-features |
| rightTitle | string      | —                    |

### slices.case-study-card

| Field         | Type                | Nested          |
| ------------- | ------------------- | --------------- |
| triangleImage | component           | media.image     |
| card          | relation (oneToOne) | api::case-study |
| buttonText    | string              | —               |

### slices.content-cards-list

| Field | Type        | Nested              |
| ----- | ----------- | ------------------- |
| cards | component[] | shared.content-card |

### slices.large-image

| Field        | Type      | Nested      |
| ------------ | --------- | ----------- |
| image        | component | media.image |
| withShadow   | boolean   | —           |
| fullWidth    | boolean   | —           |
| hideOnMobile | boolean   | —           |

### slices.image-gallery

| Field | Type        | Nested      |
| ----- | ----------- | ----------- |
| image | component[] | media.image |

### slices.brands

| Field        | Type        | Nested       |
| ------------ | ----------- | ------------ |
| brands       | component[] | shared.brand |
| marginTop    | string      | —            |
| marginBottom | string      | —            |

### slices.brands-with-intro

| Field           | Type        | Nested                      |
| --------------- | ----------- | --------------------------- |
| gradientHeader  | component   | shared.gradient-header      |
| intro           | component   | text.label-title-text-links |
| brands          | component[] | shared.brand                |
| topIntegrations | component   | links.top-integrations      |
| marginTop       | string      | —                           |
| marginBottom    | string      | —                           |

### slices.large-video

| Field          | Type                 | Nested                      |
| -------------- | -------------------- | --------------------------- |
| gradientHeader | component            | shared.gradient-header      |
| intro          | component            | text.label-title-text-links |
| url            | string               | —                           |
| darkMode       | boolean              | —                           |
| size           | enum (large, medium) | —                           |

### slices.featured-video

| Field | Type                | Nested             |
| ----- | ------------------- | ------------------ |
| video | relation (oneToOne) | api::content-video |

### slices.quote

| Field         | Type      | Nested        |
| ------------- | --------- | ------------- |
| triangleImage | component | media.image   |
| quote         | text      | —             |
| author        | component | shared.person |

### slices.full-width-quote

| Field         | Type      | Nested        |
| ------------- | --------- | ------------- |
| triangleImage | component | media.image   |
| label         | string    | —             |
| quote         | richtext  | —             |
| author        | component | shared.person |

### slices.newsletter-banner

| Field      | Type      | Nested            |
| ---------- | --------- | ----------------- |
| newsletter | component | shared.newsletter |

### slices.plan-cards

| Field             | Type        | Nested                      |
| ----------------- | ----------- | --------------------------- |
| title             | string      | —                           |
| intro             | component   | text.label-title-text-links |
| planTypes         | component[] | shared.plan-type-item       |
| cards             | component[] | shared.plan-details-card    |
| monthlyTitle      | string      | —                           |
| monthlySubtitle   | string      | —                           |
| annualTitle       | string      | —                           |
| annualSubtitle    | string      | —                           |
| showAnnualToggle  | boolean     | —                           |
| isAnnualDefault   | boolean     | —                           |
| isExtraBoxVisible | boolean     | —                           |
| extraBoxFeatures  | component[] | shared.star-features        |
| extraBoxLink      | component   | links.link                  |

### slices.plans-grid

| Field              | Type                 | Nested    |
| ------------------ | -------------------- | --------- |
| plans              | relation (oneToMany) | api::plan |
| compareButtonLabel | string               | —         |

## Shared / Nested Components

### shared.hero

| Field                     | Type        | Nested                      |
| ------------------------- | ----------- | --------------------------- |
| intro                     | component   | text.label-title-text-links |
| topRightBackgroundImage   | component   | media.image                 |
| bottomLeftBackgroundImage | component   | media.image                 |
| animation                 | component[] | slices.single-animation     |
| animations                | component[] | slices.single-animation     |
| brands                    | component   | slices.brands               |
| features                  | component[] | shared.card                 |
| strapi5Hero               | boolean     | —                           |

### text.label-title-text-links

| Field             | Type                                                | Nested                     |
| ----------------- | --------------------------------------------------- | -------------------------- |
| theme             | enum (yellow, purple, blue, white, green, darkMode) | —                          |
| label             | string                                              | —                          |
| title             | string                                              | —                          |
| text              | richtext                                            | —                          |
| cliContent        | string                                              | —                          |
| button            | component[]                                         | links.button               |
| smallTextWithLink | component[]                                         | links.small-text-with-link |
| newsWithLink      | component                                           | text.news-with-link        |
| center            | boolean                                             | —                          |

### shared.faq-category

| Field     | Type        | Nested              |
| --------- | ----------- | ------------------- |
| name      | string      | —                   |
| questions | component[] | shared.faq-question |

### shared.person

| Field       | Type      | Nested      |
| ----------- | --------- | ----------- |
| name        | string    | —           |
| description | string    | —           |
| image       | component | media.image |
| companyLogo | component | media.image |
