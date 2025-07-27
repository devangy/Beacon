import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../utils/prismaClient.js";


export const getChatMessages = async (req,res) => {

    const { chatId } = req.params

    if(!chatId) return res.status(400).json({message: "Chat ID is missing", success: false})

    // const member = await prisma.chat.findMany({
    //     where : {chatId: chatId},
    //     include: {
    //         member: true
    //     }
    // })

    // console.log('member:', member)

    const messages = await prisma.message.findMany({
        where: {chatId: chatId},
    })


    // const m = await prisma.chat.messages

    console.log('messages', messages);

    res.status(200).json({
        success: true,
        data: messages,
        message: "Chat messages retrieved"
    })
    
}

// export const saveMessageToDB = async (newMessage) => {

//     console.log('newms', newMessage)
//     conso
// }