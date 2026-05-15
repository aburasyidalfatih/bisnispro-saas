function test() {
  let args;
  try {
    args.where = { ...args?.where, tenantId: "123" }
    console.log("Success", args)
  } catch (e) {
    console.error("Error:", e.message)
  }
}
test()
