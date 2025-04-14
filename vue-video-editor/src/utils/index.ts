export function getUid() {
  return Math.random().toString(36).substring(2, 15);
}

export function isHtmlVideoElement(
  element: HTMLElement | null
): element is HTMLVideoElement {
  return !!element && element.tagName === "VIDEO";
}

export function isHtmlAudioElement(
  element: HTMLElement | null
): element is HTMLAudioElement {
  return !!element && element.tagName === "AUDIO";
}

export function isHtmlImageElement(
  element: HTMLElement | null
): element is HTMLImageElement {
  return !!element && element.tagName === "IMG";
}