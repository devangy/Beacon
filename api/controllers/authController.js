import { prisma } from "../utils/prismaClient.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

console.log("Client ID:", process.env.GITHUB_CLIENT_ID);
console.log("Client Secret:", process.env.GITHUB_CLIENT_SECRET);

export async function handleLogin(req, res) {
  const { code } = req.body;

  console.log("Github code received", code);

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Github Access Code is required",
    });
  }

  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const githubAccessToken = tokenRes.data.access_token;

    console.log("github res", githubAccessToken);

    const userInfoRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${githubAccessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    console.log("github user", userInfoRes.data);

    // check if user exists no update if not create new entry in db using the prisma 'upsert' method

    const newUserEntry = await prisma.user.upsert({
      where: { githubId: userInfoRes.data.id },
      update: {
        username: userInfoRes.data.login,
        avatarUrl: userInfoRes.data.avatar_url,
      },
      create: {
        githubId: userInfoRes.data.id,
        username: userInfoRes.data.login,
        avatarUrl: userInfoRes.data.avatar_url,
      },
    });

    console.log("newUserENtry", newUserEntry);

    // creating JWT Token with githubId  of our created or fetched user

    const accessToken = jwt.sign(
      { userId: newUserEntry.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // expires in 15 minutes
    );
    console.log("Access Token:", accessToken);

    const refreshToken = jwt.sign(
      { userId: newUserEntry.id },
      process.env.JWT_SECRET, // use a separate secret
      { expiresIn: "7d" } // valid for 7 days
    );

    const userId = newUserEntry.id;

    console.log("userId", userId);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { accessToken, refreshToken, userId },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
}
