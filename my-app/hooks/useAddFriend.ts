import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Friend } from "@/types/friend";
import { ApiResponse } from "@/types/api-response";

export const useAddFriend = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, friendId }: { userId: string; friendId: string }) => {
            const response = await axios.post<ApiResponse<Friend>>(
                `${process.env.EXPO_PUBLIC_BASE_URL}/api/friends/${userId}/add/${friendId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ACCESS_TOKEN}`,
                    },
                },
            );
            return response.data.data;
        },
        onSuccess: (data, { userId }) => {
            // Invalidate friends list query
            queryClient.invalidateQueries({ queryKey: ["userFriends", userId] });
            // Clear search results
            queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
        },
    });
};
