"use client";

import { useEffect } from "react";

export function PushSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        await navigator.serviceWorker.ready;

        const existing = await reg.pushManager.getSubscription();
        const sub =
          existing ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          }));

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch (err) {
        console.error("Push setup error:", err);
      }
    };

    setup();
  }, []);

  return null;
}
