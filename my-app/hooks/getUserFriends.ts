import { ApiResponse } from "@/types/api-response";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios from "axios";
import { Friend } from "@/types/friend";

export const getUserFriends = (userId: string) => {
    return useQuery({
        queryKey: ["userFriends", userId],
        queryFn: async () => {
            const response = await axios.get<ApiResponse<Friend[]>>(
                `http://localhost:3082/api/friends/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ACCESS_TOKEN}`,
                    },
                },
            );
            return response.data.data;
        },
        enabled: !!userId, // Only run if userId is available
        staleTime: 1000 * 60 * 5, // cache for 5 mins
    });
};
