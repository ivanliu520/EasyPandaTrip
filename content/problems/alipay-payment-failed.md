---
slug: "alipay-payment-failed"
title: "My Alipay payment failed"
summary: "Scan your QR code but the shop says it didn't work? Card got declined? Here's how to diagnose and fix payment issues in Alipay."
category: "payment"
severity: "medium"
last_verified: "2026-09-15"
status: "verified"
trigger_keywords:
  - "alipay not working"
  - "alipay declined"
  - "payment rejected"
  - "alipay fail"
related_guides:
  - "use-alipay-china"
  - "use-wechat-pay-china"
sources:
  - name: "Alipay Help Center — International Credit Card Payment Error Codes"
    url: "https://help.alipay.com/lab/help_detail.htm?help_id=256323"
    type: "official"
diagnosis:
  - slug: "step-1"
    question: "What error did you see?"
    options:
      - label: "Nothing happened — the app froze or didn't respond"
        recommended_action: "Close and reopen the Alipay app. If it still hangs, check your internet connection — bad WiFi or mobile data can cause scan failures."
        backup_action: "Switch from WiFi to mobile data, or vice versa."
      - label: "'Transaction rejected' or 'Insufficient balance'"
        recommended_action: "This usually means the merchant doesn't support international cards, or your balance is empty. Check: Me → Bank Cards → Your Card to verify it's bound and working."
        backup_action: "Try WeChat Pay instead, or pay with cash."
        requires: ["alipay_setup"]
      - label: "QR code scanned but nothing shows on shop's screen"
        recommended_action: "Make sure you scanned the right QR code — there may be multiple in busy shops. Ask the cashier: '这个吗？' (zhège ma? — Is this one?)."
        backup_action: "Show your payment code instead (tap 'Pay' button on Home screen)."
      - label: "App says payment went through but shop says no"
        recommended_action: "Check your payment records: Me → Bills. If it shows 'Pending', the merchant hasn't confirmed. Show the bill to the cashier as proof."
        backup_action: "Cancel the transaction from your Bills section and retry, or pay with a different method."
  - slug: "step-2"
    question: "Did any of the above solve it?"
    options:
      - label: "Yes, it worked!"
        recommended_action: "Great! Your Alipay is working normally now."
      - label: "No, still having trouble"
        recommended_action: "Contact Alipay support within the app: Me → Settings → Help & Feedback. Or try the emergency options below."
        backup_action: "Switch entirely to WeChat Pay for now."
        emergency_option: "Find an ATM and withdraw yuan cash. Major state-owned bank ATMs (such as Bank of China) are the most likely to accept international cards."
        requires: ["alipay_setup", "wechat_pay_setup"]
---

## Alipay Payment Failed — Troubleshooting

Payment failures are the #1 pain point for foreign users. Most issues are one of these four categories:

## Quick Checks First

1. **Is your internet working?** — Bad connection is the #1 cause of scan failures
2. **Did you scan the correct QR code?** — Some shops have multiple codes (Alipay, WeChat Pay, store loyalty)
3. **Is your card still valid and not over its limit?**

## Most Common Fix

> "Scan works, but shop says payment didn't go through"

This usually means you scanned an Alipay QR code but your payment default is set to international card — and the merchant doesn't support international card payments. Fix:

1. Open Alipay → Me → Payment Settings
2. Set your preferred payment method to **Alipay Balance** (top up first)
3. Now retry — paying from yuan balance works almost everywhere

## Emergency: No digital payments working?

1. **Find an ATM** — Some Chinese ATMs accept international cards. Look for ATMs marked with PLUS, CIRRUS, or UnionPay logos. Bank of China and other major state-owned bank ATMs are the most likely to accept international cards.
2. Availability and daily withdrawal limits vary by bank, card network, and ATM — check the on-screen prompts before proceeding.
3. If the ATM rejects your card, try a different bank's ATM or ask your hotel for help.
