---
slug: "metro-payment-failed"
title: "My metro payment isn't working (can't enter gates)"
summary: "Alipay QR code rejected at metro gate? Ticket machine not accepting your card? Here's how to get through."
category: "transport"
severity: "medium"
last_verified: "2026-09-15"
status: "verified"
trigger_keywords:
  - "metro gate not working"
  - "subway payment failed"
  - "qr code not accepted metro"
  - "cannot enter metro"
related_guides:
  - "use-metro-in-china"
  - "use-alipay-china"
sources:
  - name: "Beijing Metro — Official Website"
    url: "https://www.bjsubway.com"
    type: "official"
  - name: "Shanghai Metro — Official Website"
    url: "https://www.shmetro.com"
    type: "official"
diagnosis:
  - slug: "step-1"
    question: "Where exactly are you stuck?"
    options:
      - label: "At the QR code entry gate"
        recommended_action: "Make sure you are using the metro-specific QR code (乘车码) rather than a generic payment QR code, and follow the gate's current instructions. Gate layouts and payment markings can vary by city and station."
        backup_action: "Buy a single-journey ticket from the machine — they accept Alipay/WeChat Pay/cards/cash."
        requires: ["alipay_setup"]
      - label: "At the ticket machine — it won't take my card"
        recommended_action: "Some machines only accept UnionPay. Try a different machine or pay with Alipay/WeChat Pay at the machine's QR code scanner."
        backup_action: "Go to the customer service counter (usually has an attendant) — they can help."
        requires: ["alipay_setup"]
      - label: "Already inside — need to exit but gate rejects my payment"
        recommended_action: "Metro gates need to see a valid token for exit. If you entered with Alipay, show the same Alipay code at exit. If you bought a ticket, insert it."
        backup_action: "Go to the customer service counter inside the station — they can help your exit for a small fee or by adjusting your payment."
  - slug: "step-2"
    question: "Has this happened before at this station?"
    options:
      - label: "No, it's the first time"
        recommended_action: "This is likely a temporary system glitch or you're using the wrong code type. A station employee can usually help quickly."
      - label: "Yes, every time at this station"
        recommended_action: "This station may have outdated gates. Use a different metro entrance, or switch to buying physical tickets here."
---

## Metro Payment Troubleshooting

## QR Code Types Matter

- **Regular Alipay/WeChat Pay QR** → Works at chain stores, restaurants
- **Metro payment QR** → A special code within Alipay/WeChat that unlocks the metro gate. Find it in Alipay: Home → Transit → Metro/Subway

## The Emergency Exit Trick

If you're inside and absolutely can't exit: go to the staffed or customer-service area (most stations have one, usually near the customer service desk). Just say "请帮忙" (qǐng bāng máng — please help) and show your entry evidence. They'll let you through — sometimes with a small penalty fee.
