const VISIT_COUNTER_API_URL =
  "https://api.counterapi.dev/v2/hoan-kieu-dinhs-team-3626/pixelconvert/up";
const VISIT_COUNTER_SESSION_KEY = "pixelconvert_visit_counted";

function hasTrackedVisitInSession() {
  try {
    return sessionStorage.getItem(VISIT_COUNTER_SESSION_KEY) === "1";
  } catch (error) {
    console.debug("Visit counter session storage is unavailable.", error);
    return false;
  }
}

function markVisitTrackedInSession() {
  try {
    sessionStorage.setItem(VISIT_COUNTER_SESSION_KEY, "1");
  } catch (error) {
    console.debug("Visit counter session storage is unavailable.", error);
  }
}

function trackPageVisit() {
  if (hasTrackedVisitInSession()) {
    return;
  }

  fetch(VISIT_COUNTER_API_URL, {
    method: "GET",
    cache: "no-store",
    mode: "cors",
    keepalive: true,
  })
    .then(() => {
      markVisitTrackedInSession();
    })
    .catch((error) => {
      console.debug("Visit counter request failed.", error);
    });
}

function scheduleVisitTracking() {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(trackPageVisit, { timeout: 2000 });
    return;
  }

  window.setTimeout(trackPageVisit, 1200);
}

if (document.readyState === "complete") {
  scheduleVisitTracking();
} else {
  window.addEventListener("load", scheduleVisitTracking, { once: true });
}
