const VISIT_COUNTER_API_URL =
  "https://api.counterapi.dev/v2/hoan-kieu-dinhs-team-3626/pixelconvert/up";

function trackPageVisit() {
  fetch(VISIT_COUNTER_API_URL, {
    method: "GET",
    cache: "no-store",
    mode: "cors",
    keepalive: true,
  }).catch((error) => {
    console.debug("Visit counter request failed.", error);
  });
}

trackPageVisit();
