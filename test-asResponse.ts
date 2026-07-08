import { auth } from "./src/lib/auth";
import { headers } from "next/headers";
async function test() {
  const res = await auth.api.signInEmail({
    body: { email: "test@example.com", password: "password" },
    asResponse: true
  });
  console.log(res);
}
