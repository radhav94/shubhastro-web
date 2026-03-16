import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LOG_FILE = path.resolve("logs", "webhook.log");

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function appendLog(entry) {
  ensureLogDir();
  const line = JSON.stringify(entry, null, 2) + "\n---\n";
  fs.appendFileSync(LOG_FILE, line, "utf-8");
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data || null);
      }
    });
  });
}

/**
 * Read the API base URL from .env-cmdrc (dev environment)
 */
function getApiBaseUrl() {
  try {
    const envFile = fs.readFileSync(path.resolve(".env-cmdrc"), "utf-8");
    const envConfig = JSON.parse(envFile);
    return envConfig?.dev?.VITE_APP_API_BASE_URL || "https://devapi-shubhtalk.epicon.in";
  } catch {
    return "https://devapi-shubhtalk.epicon.in";
  }
}

/**
 * Proxy the request to the actual backend orders/update API
 */
async function proxyToBackend(payload) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/orders/update`;

  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { status: response.status, data };
}

export function webhookLoggerPlugin() {
  return {
    name: "webhook-logger",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname !== "/payment/webhook") return next();

        const body = await readBody(req);
        const timestamp = new Date().toISOString();
        const query = Object.fromEntries(url.searchParams);

        const requestLog = {
          timestamp,
          method: req.method,
          url: req.url,
          query,
          body,
        };

        console.log(`[webhook-logger] ${req.method} /payment/webhook at ${timestamp}`);

        // Extract params — handle both:
        // 1. Client redirect: orderId & planId in query string
        // 2. Razorpay server webhook: nested in body.payload.payment.entity.notes
        const flatParams = { ...query, ...(body && typeof body === "object" && !body.entity ? body : {}) };

        let orderId = flatParams.orderId;
        let planId = flatParams.planId;
        let razorpayPaymentId = flatParams.razorpay_payment_id;
        let razorpayOrderId = flatParams.razorpay_order_id;
        let razorpaySignature = flatParams.razorpay_signature;

        // If this is a Razorpay server webhook event (has body.entity === "event")
        if (body?.entity === "event" && body?.payload?.payment?.entity) {
          const payment = body.payload.payment.entity;
          const notes = payment.notes || {};

          orderId = orderId || notes.order_id;
          planId = planId || notes.plan_id;
          razorpayPaymentId = razorpayPaymentId || payment.id;
          razorpayOrderId = razorpayOrderId || payment.order_id;
        }

        if (!orderId || !planId) {
          const errorResponse = { error: "Missing orderId or planId", query, body };
          appendLog({ request: requestLog, response: errorResponse });
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 400;
          res.end(JSON.stringify(errorResponse));
          return;
        }

        // Determine payment status
        const isServerWebhook = body?.entity === "event";
        const isSuccess = isServerWebhook
          ? body?.event === "payment.captured"
          : !!(razorpayPaymentId && razorpayOrderId && razorpaySignature);
        const orderStatus = isSuccess ? "completed" : "failure";

        const apiPayload = {
          orderId: String(orderId),
          planId,
          orderStatus,
          ...(razorpayPaymentId && { razorpay_payment_id: razorpayPaymentId }),
          ...(razorpayOrderId && { razorpay_order_id: razorpayOrderId }),
          ...(razorpaySignature && { razorpay_signature: razorpaySignature }),
        };

        console.log(`[webhook-logger] Proxying to orders/update:`, JSON.stringify(apiPayload));

        try {
          const backendResponse = await proxyToBackend(apiPayload);

          const logEntry = { request: requestLog, apiPayload, response: backendResponse };
          appendLog(logEntry);

          console.log(`[webhook-logger] Backend response:`, JSON.stringify(backendResponse));

          // Always return 200 to Razorpay, but include actual backend status/message
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: "ok",
            backendStatus: backendResponse.status,
            backendResponse: backendResponse.data,
          }));
        } catch (error) {
          const errorResponse = { error: error.message };
          appendLog({ request: requestLog, apiPayload, error: errorResponse });

          console.error(`[webhook-logger] Proxy error:`, error.message);

          // Still return 200 to Razorpay so it doesn't retry
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: "ok",
            backendStatus: 502,
            backendResponse: null,
            error: error.message,
          }));
        }
      });
    },
  };
}
