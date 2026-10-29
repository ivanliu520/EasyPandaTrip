"use client";

import type { PhoneOS, Readiness, TravelerContext } from "./types";

const KEY = "ctg-traveler-context-v1";

export function defaultTravelerContext(): TravelerContext {
  return {
    has_visited_china_before: false,
    phone_os: "unknown",
    chinese_phone_number: "unknown",
    alipay: "unknown",
    wechat_pay: "unknown",
    international_card: "unknown",
    travel_cities: [],
  };
}

const READINESS: readonly Readiness[] = ["ready", "not_ready", "unknown"];
const PHONE_OS: readonly PhoneOS[] = ["ios", "android", "unknown"];

function isReadiness(v: unknown): v is Readiness {
  return typeof v === "string" && READINESS.includes(v as Readiness);
}

/**
 * Migrate a legacy boolean readiness flag to tri-state.
 *   true  -> "ready"     (user explicitly confirmed readiness)
 *   false -> "unknown"   (legacy false was the universal default; carries no signal)
 *   other -> fallback    (missing / invalid)
 */
function migrateReadiness(v: unknown): Readiness {
  if (v === true) return "ready";
  return "unknown";
}

/**
 * Read a tri-state field from already-migrated (v2) data, preserving
 * an explicit "not_ready". Anything else falls back to "unknown".
 */
function readV2Readiness(v: unknown): Readiness {
  return isReadiness(v) ? v : "unknown";
}

/**
 * Accepts v1 (legacy boolean flags) or v2 (tri-state) raw data and returns a
 * valid TravelerContext. Idempotent: valid v2 data passes through unchanged.
 * Never produces "not_ready" from legacy/missing/invalid input.
 */
function migrate(raw: Record<string, unknown>): TravelerContext {
  const d = defaultTravelerContext();

  // has_visited_china_before (v2) OR legacy first_trip_to_china (v1: true = first trip)
  let hasVisited = d.has_visited_china_before;
  if (typeof raw.has_visited_china_before === "boolean") {
    hasVisited = raw.has_visited_china_before;
  } else if (typeof raw.first_trip_to_china === "boolean") {
    hasVisited = !raw.first_trip_to_china;
  }

  const phoneOs = PHONE_OS.includes(raw.phone_os as PhoneOS)
    ? (raw.phone_os as PhoneOS)
    : d.phone_os;

  // Readiness: prefer v2 tri-state; else migrate legacy v1 boolean.
  const chinesePhone =
    raw.chinese_phone_number !== undefined
      ? readV2Readiness(raw.chinese_phone_number)
      : migrateReadiness(raw.has_chinese_phone_number);
  const alipay =
    raw.alipay !== undefined
      ? readV2Readiness(raw.alipay)
      : migrateReadiness(raw.alipay_ready);
  const wechatPay =
    raw.wechat_pay !== undefined
      ? readV2Readiness(raw.wechat_pay)
      : migrateReadiness(raw.wechat_pay_ready);
  const intlCard =
    raw.international_card !== undefined
      ? readV2Readiness(raw.international_card)
      : migrateReadiness(raw.has_international_card);

  const travelCities =
    Array.isArray(raw.travel_cities) &&
    raw.travel_cities.every((c) => typeof c === "string")
      ? (raw.travel_cities as string[])
      : d.travel_cities;

  return {
    has_visited_china_before: hasVisited,
    phone_os: phoneOs,
    chinese_phone_number: chinesePhone,
    alipay,
    wechat_pay: wechatPay,
    international_card: intlCard,
    travel_cities: travelCities,
  };
}

export function loadTravelerContext(): TravelerContext {
  if (typeof window === "undefined") return defaultTravelerContext();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultTravelerContext();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaultTravelerContext();
    }
    return migrate(parsed as Record<string, unknown>);
  } catch {
    return defaultTravelerContext();
  }
}

export function saveTravelerContext(context: TravelerContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(context));
}

export function updateTravelerContext(
  partial: Partial<TravelerContext>
): TravelerContext {
  const current = loadTravelerContext();
  const merged = { ...current, ...partial };
  // Ensure arrays are replaced, not merged, for travel_cities
  if (partial.travel_cities !== undefined) {
    merged.travel_cities = partial.travel_cities;
  }
  saveTravelerContext(merged);
  return merged;
}
