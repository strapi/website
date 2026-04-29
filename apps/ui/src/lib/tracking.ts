interface DataLayerEvent {
  event: string
  [key: string]: unknown
}

export function pushDataLayerEvent(data: DataLayerEvent) {
  if (typeof window === "undefined") return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(data)
}
