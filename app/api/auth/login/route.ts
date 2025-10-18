
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// It's recommended to move the secret to an environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // In a real application, you should validate the credentials against a database
    if (username === "admin" && password === "admin") {
      const token = jwt.sign({ username }, JWT_SECRET, {
        expiresIn: "1h",
      });

      return NextResponse.json({ token });
    } else {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
