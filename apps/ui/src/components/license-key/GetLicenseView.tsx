"use client"

import { CopySimpleIcon, DownloadSimpleIcon } from "@phosphor-icons/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { TokenErrors } from "@/components/license-key/TokenErrors"
import { Typography } from "@/components/typography"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { env } from "@/env.mjs"
import { useClip } from "@/hooks/useClip"
import { cn } from "@/lib/styles"

interface GetLicenseViewProps {
  readonly token: string | undefined
  /**
   * Skip the "Show license key" click and fetch on load. Only set when the
   * person already clicked through /order-confirmation (Growth flow).
   */
  readonly revealOnLoad?: boolean
}

/**
 * - `checking`: validating the token (does not use it up)
 * - `ready`: waiting for the person to click "Show license key"
 * - `revealed`: the license was requested (this uses the token up)
 */
type RevealStep = "checking" | "ready" | "revealed"

/**
 * One-time license reveal, ported from website-2020 `pages/get-license.js`.
 * Reached from /order-confirmation (Growth) or straight from a license email
 * (Enterprise).
 *
 * The registry invalidates the token on the first successful
 * `/api/get-license` call. Email security scanners often open links in a
 * headless browser before the customer does, so fetching on load let them
 * burn the token before the customer ever saw the key. By default, on load we
 * only call `/api/validate-token` (does not use the token up) and fetch the
 * license when the person clicks "Show license key".
 *
 * `revealOnLoad` keeps the old fetch-on-load behaviour for links coming from
 * /order-confirmation, where the person already clicked once.
 *
 * Errors map to the states in {@link TokenErrors}.
 */
export function GetLicenseView({ token, revealOnLoad }: GetLicenseViewProps) {
  const [step, setStep] = useState<RevealStep>(
    revealOnLoad ? "revealed" : "checking"
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [licenseKey, setLicenseKey] = useState("")
  const [planDisplayName, setPlanDisplayName] = useState("")
  const [error, setError] = useState<string | null>(
    token ? null : "ERR_TOKEN_NOT_FOUND"
  )
  const [isLicenseLoading, setIsLicenseLoading] = useState(
    Boolean(revealOnLoad && token)
  )
  const { copied: copySuccess, copy } = useClip()

  const checkToken = useCallback(async () => {
    if (!token) {
      return
    }

    const apiEndpoint = `${env.NEXT_PUBLIC_LICENSE_REGISTRY_API_URL}/api/validate-token?token=${encodeURIComponent(token)}`

    try {
      const response = await fetch(apiEndpoint)
      const result = await response.json()

      if (response.status !== 200) {
        setError(result.error?.message ?? "DEFAULT")
      }
    } catch (checkError) {
      // The check is only there to show errors early: if it fails, still let
      // the person try to reveal the key.
      console.error("Error while validating license token:", checkError)
    } finally {
      setStep("ready")
    }
  }, [token])

  const fetchLicenseKey = useCallback(async () => {
    if (!token) {
      return
    }

    const apiEndpoint = `${env.NEXT_PUBLIC_LICENSE_REGISTRY_API_URL}/api/get-license?token=${encodeURIComponent(token)}`

    try {
      const response = await fetch(apiEndpoint)
      const result = await response.json()

      if (response.status !== 200) {
        setError(result.error?.message ?? "DEFAULT")

        return
      }

      setLicenseKey(result.license)
      setPlanDisplayName(result.planDisplayName ?? "")
    } catch (fetchError) {
      console.error("Error while fetching license key:", fetchError)
      setError("DEFAULT")
    } finally {
      setIsLicenseLoading(false)
    }
  }, [token])

  // React strict mode runs effects twice in development. A second
  // `/api/get-license` call would hit an already used token and show an error,
  // so only load once per mount.
  const hasLoadedOnMount = useRef(false)

  useEffect(() => {
    if (hasLoadedOnMount.current) {
      return
    }

    hasLoadedOnMount.current = true

    const loadOnMount = revealOnLoad ? fetchLicenseKey : checkToken

    void loadOnMount()
  }, [revealOnLoad, checkToken, fetchLicenseKey])

  const revealLicenseKey = () => {
    setStep("revealed")
    setIsLicenseLoading(true)
    void fetchLicenseKey()
  }

  const retry = () => {
    setError(null)

    if (revealOnLoad) {
      revealLicenseKey()

      return
    }

    setStep("checking")
    void checkToken()
  }

  const handleCopy = async () => {
    await copy(licenseKey)
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([licenseKey], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "license.txt"
    element.click()
  }

  if (error) {
    return <TokenErrors error={error} validateToken={retry} />
  }

  // Copy reused from this page's header and from /order-confirmation, which
  // was the click step for the Growth flow.
  if (step !== "revealed") {
    return (
      <div className="flex flex-col items-start gap-8 py-8">
        <div>
          <Typography tag="h1" variant="header2" className="mb-4">
            License access
          </Typography>
          <Typography tag="p" variant="subtitle1" textColor="muted">
            Your Strapi license is ready.
          </Typography>
        </div>

        <div className="flex flex-col gap-4">
          <Typography tag="p" variant="body2">
            For security reasons, you can access your license from this page
            only once.
          </Typography>
          <Typography tag="p" variant="body2">
            Make sure you are ready to copy and save it in the next step.
          </Typography>
        </div>

        <Button
          type="button"
          onClick={revealLicenseKey}
          disabled={step === "checking"}
        >
          Show license key
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      <div>
        <Typography tag="h1" variant="header2" className="mb-4">
          License access
        </Typography>
        <Typography tag="p" variant="subtitle1" textColor="muted">
          {planDisplayName
            ? `Your ${planDisplayName} license is ready.`
            : "Your Strapi license is ready."}
        </Typography>
      </div>

      <div className="grid w-full grid-cols-12 gap-8 md:gap-[60px]">
        <div className="col-span-12 flex flex-col gap-8 md:col-span-8">
          <div className="border-strapi-neutral-300 flex flex-col gap-4 rounded-md border p-8">
            <Typography
              tag="p"
              variant="smallText2"
              textColor="muted"
              fontWeight="bold"
              uppercase
              className="tracking-[1px]"
            >
              License
            </Typography>

            {isLicenseLoading ? (
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : (
              <Typography
                tag="p"
                variant="subtitle2"
                className={cn(
                  "font-mono break-words transition-all",
                  !isExpanded && "line-clamp-3"
                )}
              >
                {licenseKey}
              </Typography>
            )}

            <div className="mt-2 flex flex-wrap justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isLicenseLoading}
              >
                {isExpanded ? "Show Less" : "Show More"}
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={isLicenseLoading}
                >
                  <DownloadSimpleIcon size={16} />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={isLicenseLoading}
                >
                  <CopySimpleIcon size={16} />
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Typography tag="p" variant="smallText1" textColor="muted">
              By using the license key provided to access the Strapi software or
              renewing your subscription, you confirm your agreement to the
              terms and conditions outlined in the Strapi Enterprise Edition
              Software License Agreement.
            </Typography>
            <Typography tag="p" variant="smallText1" textColor="muted">
              You can review the full agreement{" "}
              <a
                href="https://strapi.io/enterprise-terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                here
              </a>
              . These terms apply from the subscription Effective Date and
              govern your use of the Strapi software.
            </Typography>
          </div>
        </div>

        <div className="border-strapi-blue-300 bg-strapi-blue-100 col-span-12 flex h-fit flex-col gap-4 rounded-md border p-8 md:col-span-4">
          <Typography
            tag="p"
            variant="smallText2"
            fontWeight="bold"
            uppercase
            className="text-strapi-blue-500 tracking-[1px]"
          >
            What’s next?
          </Typography>
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
            <li>Download the file or copy-paste the license</li>
            <li>
              Move the <span className="font-mono">license.txt</span> file at
              the root of your Strapi project or add the{" "}
              <span className="bg-strapi-blue-200 border-strapi-blue-400 rounded-sm border px-2 py-1 font-mono">
                STRAPI_LICENSE=&lt;your_license&gt;
              </span>{" "}
              in your .env file.
            </li>
            <li>Start your project</li>
          </ol>

          <hr className="border-strapi-blue-300" />

          <Typography
            tag="p"
            variant="smallText2"
            fontWeight="bold"
            uppercase
            className="text-strapi-blue-500 tracking-[1px]"
          >
            Manage subscription
          </Typography>
          <Typography tag="p" variant="smallText1">
            Click{" "}
            <a
              href={env.NEXT_PUBLIC_CHARGEBEE_PORTAL ?? "#"}
              className="underline underline-offset-4"
            >
              here
            </a>{" "}
            to manage or modify your subscription.
          </Typography>
        </div>
      </div>
    </div>
  )
}
