import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type GetUserChatsArgs = {
  userId: string;
  token: string;
};

export const useGetUserChats = ({ userId, token }: GetUserChatsArgs) => {
  return useQuery({
    queryKey: ["userChats", userId],
    queryFn: async (): Promise<Chat[]> => {
      const response = await axios.get(`/api/chats/user/${userId}`, {
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
