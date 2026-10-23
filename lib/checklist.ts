"use client";

const KEY = "ctg-checklist-v1";

export interface ChecklistAnswers {
  has_alipay: boolean;
  has_wechat_pay: boolean;
  has_internet_plan: boolean;
  has_map_app: boolean;
  has_cash_backup: boolean;
  has_chinese_phrases: boolean;
  has_hotel_address_cn: boolean;
  notes?: Record<string, string>;
}

export interface ChecklistTask {
  id: string;
  label: string;
  description: string;
  guideSlug?: string;
}

export const QUESTIONS: {
  key: keyof ChecklistAnswers;
  title: string;
  description: string;
}[] = [
  {
    key: "has_alipay",
    title: "Alipay set up",
    description: "Downloaded, registered, and ready to use",
  },
  {
    key: "has_wechat_pay",
    title: "WeChat Pay set up",
    description: "Downloaded and linked to a payment method",
  },
  {
    key: "has_internet_plan",
    title: "Internet / eSIM prepared",
    description: "You know how you'll get online in China",
  },
  {
    key: "has_map_app",
    title: "Navigation app ready",
    description: "Gaode or Baidu Maps installed",
  },
  {
    key: "has_cash_backup",
    title: "Cash backup",
    description: "You have some yuan or know how to withdraw",
  },
  {
    key: "has_chinese_phrases",
    title: "Basic Chinese phrases",
    description: "You know a few key phrases or have a phrasebook",
  },
  {
    key: "has_hotel_address_cn",
    title: "Hotel address in Chinese",
    description: "You can show your address to taxi drivers",
  },
];

export const TASK_MAP: Record<string, { label: string; guideSlug: string }> = {
  has_alipay: {
    label: "Set up Alipay",
    guideSlug: "use-alipay-china",
  },
  has_wechat_pay: {
    label: "Set up WeChat Pay",
    guideSlug: "use-wechat-pay-china",
  },
  has_internet_plan: {
    label: "Prepare internet access",
    guideSlug: "get-internet-in-china",
  },
  has_map_app: {
    label: "Install navigation app",
    guideSlug: "", // not yet a dedicated guide, will point to daily-life
  },
  has_cash_backup: {
    label: "Arrange cash backup",
    guideSlug: "",
  },
  has_chinese_phrases: {
    label: "Learn key Chinese phrases",
    guideSlug: "",
  },
  has_hotel_address_cn: {
    label: "Get your hotel address in Chinese",
    guideSlug: "",
  },
};

export function loadAnswers(): ChecklistAnswers {
  if (typeof window === "undefined") return defaultAnswers();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultAnswers();
    return { ...defaultAnswers(), ...JSON.parse(raw) };
  } catch {
    return defaultAnswers();
  }
}

export function saveAnswers(answers: ChecklistAnswers) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(answers));
}

export function defaultAnswers(): ChecklistAnswers {
  return {
    has_alipay: false,
    has_wechat_pay: false,
    has_internet_plan: false,
    has_map_app: false,
    has_cash_backup: false,
    has_chinese_phrases: false,
    has_hotel_address_cn: false,
  };
}

export function getProgress(answers: ChecklistAnswers) {
  const values = Object.values(answers).filter(
    (v) => typeof v === "boolean"
  ) as boolean[];
  const done = values.filter(Boolean).length;
  return { done, total: values.length, percent: Math.round((done / values.length) * 100) };
}

export function getMissingTasks(answers: ChecklistAnswers) {
  const missing: { key: string; task: typeof TASK_MAP[string] }[] = [];
  for (const [key, task] of Object.entries(TASK_MAP)) {
    if (!answers[key as keyof ChecklistAnswers]) {
      missing.push({ key, task });
    }
  }
  return missing;
}
