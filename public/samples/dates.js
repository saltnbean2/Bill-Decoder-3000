// Fills [data-date] elements with today (in Los Angeles) + N days, so sample deadlines stay realistic.
(function () {
  var parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()).split("-").map(Number);
  var q = new URLSearchParams(location.search).get("today"); // optional override: ?today=2026-11-14
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) parts = q.split("-").map(Number);
  document.querySelectorAll("[data-date]").forEach(function (el) {
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + Number(el.dataset.date)));
    var fmt = el.dataset.fmt || "long";
    var opts = fmt === "short"
      ? { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "UTC" }
      : { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" };
    if (fmt === "weekday") opts = { weekday: "long", timeZone: "UTC" };
    el.textContent = new Intl.DateTimeFormat("en-US", opts).format(d);
  });
})();
