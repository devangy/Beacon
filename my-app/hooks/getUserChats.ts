import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Chat } from "@/types/chat";
import { ApiResponse } from "@/types/api.response";

type GetUserChatsArgs = {
  userId: string;
  token: string;
};

export const useGetUserChats = ({ userId, token }: GetUserChatsArgs) => {
  return useQuery({
    queryKey: ["userChats", userId],
    queryFn: async () => {
      const response = await axios.get<ApiResponse<Chat[]>>(`/api/chats/user/${userId}`, {
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
