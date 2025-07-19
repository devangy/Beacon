import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Chat } from "@/types/chat";
import { ApiResponse } from "@/types/api-response";


export const useGetUserChats = (userId: string , token?: string | undefined) => {
  return useQuery({
    queryKey: ["userChats", userId],
    queryFn: async () => {
      const response = await axios.get<ApiResponse<Chat[]>>(`http://localhost:3000/api/chats/all-chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    },
    enabled: !!userId && !!token, // Only run if userId and token are available
    staleTime: 1000 * 60 * 5, // cache for 5 mins
  });
};
