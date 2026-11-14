import { buildIcs } from "@/lib/calendar";

/**
 * Returns a real calendar file. The page POSTs a form here (so document details never go
 * in a URL); iPhone Safari then shows the native "Add to Calendar" sheet, and desktop
 * browsers download a .ics that opens in Apple Calendar / Outlook.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const title = String(form.get("title") ?? "").slice(0, 200);
  const date = String(form.get("date") ?? "");
  const details = String(form.get("details") ?? "").slice(0, 2000);
  const location = String(form.get("location") ?? "").slice(0, 300) || undefined;
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("bad request", { status: 400 });
  }
  return new Response(buildIcs({ title, date, details, location }), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="deadline.ics"',
      "cache-control": "no-store",
    },
  });
}
