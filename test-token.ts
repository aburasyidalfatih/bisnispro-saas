import { createToken } from "./src/features/auth/services/token.service"

async function test() {
  try {
    const res = await createToken("fake-application-id", "school_register", 24)
    console.log("Success:", res)
  } catch (err) {
    console.error("Failed:", err)
  }
}
test()
