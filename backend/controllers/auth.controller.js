import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

/**
 * Generates an access token and a refresh token for the given user ID.
 *
 * @param {string} userID - The ID of the user to generate tokens for.
 *
 * @returns {Object} An object containing both the access token and the refresh token. The access
 * token is a JWT that can be used to authenticate with the server. The refresh token is also a JWT
 * that can be used to get a new access token when the current one expires.
 */

const generateToken = (userID) => {
  const accessToken = jwt.sign({ userID }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userID }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_Token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // prevent XSS attacks, cross site scripting attack
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevent XSS attacks, cross site scripting attack
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({
      name,
      email,
      password,
    });

    const { accessToken, refreshToken } = generateToken(user._id);

    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      user: { name, email, role: user.role, _id: user._id },
      message: "User created successfully",
    });
  } catch (error) {
    console.log("Error in signup", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateToken(user._id);

      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: "User logged in successfully",
      });
      }
      else{
        res.status(401).json({ message: "Invalid email or password" });
      }
    
    } catch (error) {
      console.log("Error in login", error.message);
      res.status(500).json({ error: error.message, message: "Server error" });
    }
  };

  export const logout = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await redis.del(`refresh_Token:${decoded.userID}`);
      }
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.json({
        message: "User logged out successfully",
      })
    } catch (error) {
      console.log("Error in logout", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  export const refresh_accessToken = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const storedToken = await redis.get(`refresh_Token:${decoded.userID}`);
        
        if (storedToken !== refreshToken) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        const userID = decoded.userID;
        
        const accessToken = jwt.sign({ userID }, process.env.JWT_ACCESS_SECRET, {
          expiresIn: "15m",
        });
        
        res.cookie("accessToken", accessToken, {
          httpOnly: true, // prevent XSS attacks, cross site scripting attack
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.json({message:"Access token refreshed successfully"});

      } else {
        res.status(401).json({ message: "Refresh token not found in cookies" });
      }
    } catch (error) {
      console.log("Error in refreshAccessToken", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };