import useSWR from "swr";
import { useEffect } from "react";
import { toast } from "sonner";

export const fetcher = async (url) => {
  const res = await fetch(url);
  const { message, data } = await res.json();
  if (res.ok) {
    return data;
  } else {
    throw new Error(message);
  }
};

export function useData(url, errorTitle, options) {
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    shouldRetryOnError: false,  // Do not retry on error
    ...options
  });

  // Show error toast only if errorTitle is provided
  useEffect(() => {
    if (error && errorTitle) {
      toast.error(errorTitle, {
        description: error.message,
      });
    }
  }, [error, errorTitle]);

  return { data, error, isLoading, mutate };
}
