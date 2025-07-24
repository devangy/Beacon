import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../utils/prismaClient.js";


export const getChatMessages = async (req,res) => {

    const { chatId } = req.params

    if(!chatId) return res.status(400).json({message: "Chat ID is missing", success: false})

    const messages = prisma.message.findMany({
        where: {chatId: chatId},
        include: {
            messages: true
        }
    })


    console.log('messages', messages);

    
}