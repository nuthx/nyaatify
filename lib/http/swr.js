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

export function useData(url, errorTitle = "Request Failed", options) {
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, options);

  // Show error toast if request failed
  useEffect(() => {
    if (error) {
      toast.error(errorTitle, {
        description: error.message,
      });
    }
  }, [error]);

  return { data, error, isLoading, mutate };
}
