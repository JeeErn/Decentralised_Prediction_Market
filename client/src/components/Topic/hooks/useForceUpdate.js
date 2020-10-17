import { useState, useCallback } from 'react'

export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
      console.log("update");
    setTick(tick => tick + 1);
  }, [])

  return update;
}