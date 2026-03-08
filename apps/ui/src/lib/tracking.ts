interface DataLayerEvent {
  event: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
  }
}

export function pushDataLayerEvent(data: DataLayerEvent) {
  if (typeof window === "undefined") return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(data)
}
