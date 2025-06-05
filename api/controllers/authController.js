// import { prisma } from "../utils/prismaClient.js"
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

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

    const githubUserInfo = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${githubAccessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    console.log("github user", githubUserInfo.data);

    // Add your GitHub OAuth logic here
    // Example:
    // 1. Exchange code for access token
    // 2. Get user info from GitHub API
    // 3. Create or find user in database
    // 4. Generate JWT token
    // 5. Send response

    res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
