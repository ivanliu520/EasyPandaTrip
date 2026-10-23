---
slug: "internet-not-working"
title: "My internet isn't working in China"
summary: "Mobile data not connecting? VPN not working? WiFi too slow? Diagnose and fix internet issues in China."
category: "internet"
severity: "high"
last_verified: "2026-09-15"
status: "verified"
trigger_keywords:
  - "no internet"
  - "data not working"
  - "vpn not working"
  - "wifi down"
related_guides:
  - "get-internet-in-china"
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
        recommended_action: "VPN servers get blocked sometimes. Disconnect and reconnect — it may switch to a different server. If still down, switch to your second backup VPN."
        backup_action: "Wait 10-15 minutes — blocks are often temporary. Avoid using one VPN app exclusively."
        emergency_option: "Use hotel WiFi which may have different routing than mobile data, or download maps for offline use."
  - slug: "step-2"
    question: "What type of internet do you need access to right now?"
    options:
      - label: "Blocked sites (Google, Gmail, etc.)"
        recommended_action: "This definitely needs a VPN. Check if your VPN is connected. If it's red/disconnected, tap 'Connect'."
      - label: "Local services (Alipay, WeChat, maps)"
        recommended_action: "These work without VPN. If they don't load, your underlying connection is broken — go back to Step 1."
      - label: "Just need to send a message"
        recommended_action: "WeChat works without VPN. If WeChat isn't loading, your mobile data or WiFi has the problem."
---

# Internet Not Working — Quick Fixes

## The Most Common Issue: VPN Suddenly Stops

China actively blocks VPN servers. It's not if, but when:

1. **First fix**: Disconnect and reconnect your VPN — it may auto-switch to a fresh server
2. **Second fix**: Restart your phone — this refreshes all connections
3. **Permanent fix**: Always have 2 VPN apps installed (primary + backup)

## eSIM Tips

- If you bought an eSIM before travel, make sure it's **activated while you still have home internet** — once in China, you might not be able to access the activation page
- eSIMs from Airalo/Nomad/aloSIM generally work well across all of China

## If Absolutely Nothing Works

1. Head to a major hotel front desk — they almost always have WiFi even if their "public" WiFi isn't working well
2. Find a Starbucks — their WiFi is reliable
3. **Download Gaode Maps offline** — this works without internet and saves you even if everything else fails
