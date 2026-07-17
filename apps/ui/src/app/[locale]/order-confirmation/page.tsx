import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import { AppLink } from "@/components/elementary/AppLink"
import { Container } from "@/components/elementary/Container"
import { MinimalHeader } from "@/components/layouts/MinimalHeader"
import { TokenErrors } from "@/components/license-key/TokenErrors"
import { Typography } from "@/components/typography"
import {
  formatDate,
  formatPrice,
  getSeats,
  isDecodableEmail,
  isSsoPlan,
  nextChargeDate,
} from "@/lib/license-key"

/*
 * The page is driven entirely by checkout/email query params, so it must be
 * rendered at request time. It is also exempted from the query-param rewrite
 * in `dynamicRewrite` (see `dedicatedRouteSegments`).
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Order confirmation",

  // Transactional page carrying license tokens — never index it.
  robots: {
    index: false,
    follow: false,
  },
}

const asString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/**
 * Standalone post-checkout page (no site navigation/footer), ported from
 * website-2020 `pages/order-confirmation.js`. Reached two ways:
 *
 * - from the checkout, with customer/subscription/invoice params — shows the
 *   order summary and links to the one-time license reveal
 * - from the confirmation email, with `token`/`tokenLifetimeInHours`/`email`
 *
 * Either way the "Show license key" button forwards the token to /get-license.
 */
export default function OrderConfirmationPage(
  props: PageProps<"/[locale]/order-confirmation">
) {
  const { locale } = use(props.params) as { locale: Locale }
  setRequestLocale(locale)

  const query = use(props.searchParams)

  const customerEmail = asString(query.customerEmail)
  const customerId = asString(query.customerId)
  const subscriptionId = asString(query.subscriptionId)
  const planId = asString(query.planId)
  const subscriptionCreatedAt = asString(query.subscriptionCreatedAt)
  const invoiceAmount = asString(query.invoiceAmount)
  const invoiceAmountPaid = asString(query.invoiceAmountPaid)
  const emailToken = asString(query.token)
  const tokenLifetimeInHours = asString(query.tokenLifetimeInHours)
  const email = asString(query.email)

  const validCustomerEmail = isDecodableEmail(customerEmail)
    ? customerEmail
    : null
  const validEmail = isDecodableEmail(email) ? email : null

  const userComingFromCheckoutPage = Boolean(
    validCustomerEmail &&
    customerId &&
    subscriptionId &&
    planId &&
    subscriptionCreatedAt &&
    invoiceAmount &&
    invoiceAmountPaid
  )
  const userComingFromEmail = Boolean(
    emailToken && tokenLifetimeInHours && validEmail
  )

  const token = userComingFromEmail
    ? emailToken
    : `${customerId}-${subscriptionId}`

  return (
    <div className="flex w-full flex-col">
      <div data-minimal-layout hidden />
      <MinimalHeader />

      <main>
        <Container>
          {!userComingFromCheckoutPage && !userComingFromEmail ? (
            <TokenErrors />
          ) : (
            <div className="flex flex-col gap-8 py-8">
              <div>
                <Typography tag="h1" variant="header2" className="mb-4">
                  Thank you for your order!
                </Typography>
                <Typography tag="p" variant="subtitle1" textColor="muted">
                  {userComingFromCheckoutPage
                    ? `Your receipt and license key are on the way to ${validCustomerEmail}`
                    : `Your receipt has been sent to ${validEmail}`}
                </Typography>
              </div>

              <div className="grid w-full grid-cols-12 gap-8 md:gap-[60px]">
                <div className="col-span-12 flex flex-col items-start gap-8 md:col-span-8">
                  <div className="flex flex-col gap-4">
                    <Typography
                      tag="h2"
                      variant="subtitle1"
                      fontWeight="semiBold"
                    >
                      License key details
                    </Typography>
                    <Typography tag="p" variant="body2">
                      For security reasons, you can access your license from
                      this page only once.
                    </Typography>
                    <Typography tag="p" variant="body2">
                      Make sure you are ready to copy and save it in the next
                      step.{" "}
                      <b className="font-medium">
                        This page will remain available for{" "}
                        {tokenLifetimeInHours ? "12 hours" : "1 hour"}.
                      </b>{" "}
                      {userComingFromCheckoutPage
                        ? "After that, you can still access your license using the link in your confirmation email. The email link will remain valid for 12 hours."
                        : "After that, the license will no longer be accessible, and you will need to contact support for assistance."}
                    </Typography>
                  </div>

                  <AppLink href={`/get-license?token=${token}`}>
                    Show license key
                  </AppLink>
                </div>

                {userComingFromCheckoutPage && (
                  <div className="border-strapi-neutral-200 col-span-12 flex flex-col gap-4 rounded-md border p-8 md:col-span-4">
                    <Typography
                      tag="p"
                      variant="smallText2"
                      textColor="muted"
                      fontWeight="bold"
                      uppercase
                      className="tracking-[1px]"
                    >
                      Order summary
                    </Typography>

                    <div className="flex justify-between gap-4">
                      <div>
                        <Typography
                          tag="p"
                          variant="body2"
                          fontWeight="semiBold"
                        >
                          Growth plan {isSsoPlan(planId ?? "") && "+ SSO"}
                        </Typography>
                        <Typography
                          tag="p"
                          variant="smallText1"
                          textColor="muted"
                        >
                          {getSeats(invoiceAmount ?? 0, planId ?? "")}{" "}
                          {getSeats(invoiceAmount ?? 0, planId ?? "") > 1
                            ? "seats"
                            : "seat"}
                        </Typography>
                        <Typography
                          tag="p"
                          variant="smallText1"
                          textColor="muted"
                        >
                          Starts {formatDate(subscriptionCreatedAt ?? "")}
                        </Typography>
                      </div>
                      <Typography
                        tag="p"
                        variant="smallText1"
                        textColor="muted"
                      >
                        {formatPrice(invoiceAmount ?? 0)}
                      </Typography>
                    </div>

                    <hr className="border-strapi-neutral-200" />

                    <div className="flex justify-between gap-4">
                      <Typography tag="p" variant="body1" fontWeight="semiBold">
                        Today&apos;s total
                      </Typography>
                      <Typography tag="p" variant="body1">
                        {formatPrice(invoiceAmountPaid ?? 0)}
                      </Typography>
                    </div>

                    <hr className="border-strapi-neutral-200" />

                    <div className="flex justify-between gap-4">
                      <div>
                        <Typography tag="p" variant="smallText1">
                          Total billed monthly
                        </Typography>
                        <Typography
                          tag="p"
                          variant="smallText2"
                          textColor="muted"
                        >
                          Next charge date{" "}
                          {nextChargeDate(subscriptionCreatedAt ?? "")}
                        </Typography>
                      </div>
                      <Typography
                        tag="p"
                        variant="smallText1"
                        textColor="muted"
                      >
                        {formatPrice(invoiceAmount ?? 0)}
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  )
}
