import { ApiResponse } from "@/types/api-response";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface SearchUser {
    id: string;
    username: string;
    avatarUrl: string;
}

export const searchUsers = (userId: string, query: string) => {
    return useQuery<SearchUser[]>({
        queryKey: ["searchUsers", userId, query],
        queryFn: async () => {
            if (!query.trim()) return [];

            const response = await axios.get<ApiResponse<SearchUser[]>>(
                `${process.env.EXPO_PUBLIC_BASE_URL}/api/friends/${userId}/search/${encodeURIComponent(query)}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ACCESS_TOKEN}`,
                    },
                },
            );
            return response.data.data || [];
        },
        enabled: !!userId && !!query.trim(),
        staleTime: 1000 * 60 * 1, // cache for 1 min
    });
};
