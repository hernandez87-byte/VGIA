export function GET() {
  return Response.json({
    service: "vigia-web",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
