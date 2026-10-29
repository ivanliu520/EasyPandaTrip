---
slug: "internet-not-working"
title: "My internet isn't working in China"
summary: "Mobile data not connecting? VPN not working? WiFi too slow? Diagnose and fix internet issues in China."
category: "internet"
severity: "high"
last_verified: "2026-09-15"
status: "draft"
trigger_keywords:
  - "no internet"
  - "data not working"
  - "vpn not working"
  - "wifi down"
related_guides:
  - "get-internet-in-china"
sources:
  - name: "National Immigration Administration — Welcome to China (SIM card real-name registration)"
    url: "https://www.nia.gov.cn/2022cn/files/basic-html/page44.html"
    type: "official"
diagnosis:
  - slug: "step-1"
    question: "Which of these is your issue?"
    options:
      - label: "Mobile data (eSIM) not connecting at all"
        recommended_action: "Go to phone Settings → Cellular/Mobile Data. Make sure the China eSIM plan is enabled and has remaining data. Restart your phone."
        backup_action: "Turn off WiFi and airplane mode on, then off — this resets the cellular connection."
      - label: "Mobile data works but very slow or intermittent"
        recommended_action: "In dense areas (subways, shopping malls), connection can be spotty. Toggle airplane mode to reset. If persistent, check if your data plan has hit the speed throttle limit."
        backup_action: "Connect to WiFi — hotels and cafes usually have better connections."
      - label: "WiFi connects but no actual internet"
        recommended_action: "Some hotel/cafe WiFi requires accepting terms in a browser. Open Safari/Chrome and see if a login page appears. Accept terms if needed."
        backup_action: "If no login page appears, the router may be down. Ask staff: 'WiFi down?' or 'WiFi bù xíng?' (WiFi不行)."
      - label: "VPN suddenly stopped working"
        recommended_action: "VPN connections can be disrupted or stop working from time to time. Disconnect and reconnect — it may switch to a different server. If still down, switch to your second backup VPN."
        backup_action: "Wait a while and reconnect — disruption may be temporary. Avoid relying on one VPN app exclusively."
        emergency_option: "Use hotel WiFi which may have different routing than mobile data. Keep a screenshot of your destination's Chinese name and address as a readable backup — a screenshot is not offline map navigation."
  - slug: "step-2"
    question: "What type of internet do you need access to right now?"
    options:
      - label: "Blocked sites (Google, Gmail, etc.)"
        recommended_action: "In mainland China, these services normally require a working VPN. Check if your VPN is connected. If it's red/disconnected, tap 'Connect'. This page does not cover Hong Kong or Macao, which have different rules."
      - label: "Local services (Alipay, WeChat, maps)"
        recommended_action: "These work without VPN. If they don't load, your underlying connection is broken — go back to Step 1."
      - label: "Just need to send a message"
        recommended_action: "WeChat works without VPN. If WeChat isn't loading, your mobile data or WiFi has the problem."
---

## Internet Not Working — Quick Fixes

## If Your VPN Stops Working

VPN connections can be disrupted or stop working from time to time:

1. **First fix**: Disconnect and reconnect your VPN — it may auto-switch to a fresh server
2. **Second fix**: Restart your phone — this refreshes all connections
3. **Practical tip**: Keep 2 VPN apps installed (primary + backup)

## eSIM Tips

- It's worth activating your eSIM while you still have a reliable home connection — this is **preventive advice, not a verified requirement**, since we have not confirmed what each provider's activation flow allows once you are in China
- Coverage depends on your eSIM provider and where you are in China — check your provider's coverage for your destinations before you rely on it
- If you switch to a **local SIM instead**, China requires real-name registration for phone numbers: bring your valid passport to a carrier business hall or register through the carrier's official site (National Immigration Administration, "Welcome to China", p. 44)

## If Absolutely Nothing Works

1. Head to a major hotel front desk — staff usually know whether their WiFi is up, and can point you to a connection that works
2. Starbucks and other major coffee chains may have WiFi available, but availability and reliability vary by location
3. **Keep a written backup of where you're going** — save your destination's Chinese name and address as a screenshot or a text note while you still have a connection. It stays readable when data fails, but it is not offline map navigation

These are practical troubleshooting suggestions from experience, not official statements from any carrier, app, or regulator.

One claim on this page is sourced: the SIM real-name registration and valid-passport point, from the National Immigration Administration. That source does not verify anything else here — in particular, it says nothing about VPN behaviour, eSIM activation, access to overseas services, or public WiFi. Those parts are unverified practical advice, and this page is marked `draft` for that reason.
