import { useSocket as useSocketContext } from "@/contexts/socket-context";

export function useSocket() {
  return useSocketContext();
}
