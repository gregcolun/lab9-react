import { useEffect, useRef, useState } from "react";

function getRemainingSeconds(duration, startedAt) {
  if (!duration) {
    return null;
  }

  if (!startedAt) {
    return duration;
  }

  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, duration - elapsedSeconds);
}

export function useTimer({ duration, startedAt, isActive, onExpire }) {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(duration, startedAt),
  );
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(getRemainingSeconds(duration, startedAt));
  }, [duration, startedAt]);

  useEffect(() => {
    if (!duration || !isActive) {
      return undefined;
    }

    const tick = () => {
      const nextRemaining = getRemainingSeconds(duration, startedAt);
      setRemaining(nextRemaining);

      if (nextRemaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);

    return () => window.clearInterval(interval);
  }, [duration, startedAt, isActive]);

  return {
    remaining,
    progress: duration && remaining !== null ? (remaining / duration) * 100 : 100,
  };
}
