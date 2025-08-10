import { SparkWallet } from "@buildonspark/spark-sdk"
import bip39 from "bip39"
import { c, read_wallet, write_wallet, print_box } from "./utils.js"

const existing = await read_wallet()
if (existing) {
  const lines = []
  if (existing.sparkAddress) lines.push(`SPARK ADDRESS: ${existing.sparkAddress}`)
  if (existing.depositAddress) lines.push(`DEPOSIT ADDRESS: ${existing.depositAddress}`)
  lines.push("")
  lines.push("TO RESET, DELETE wallet.json")
  print_box("WALLET ALREADY EXISTS", lines, c.yellow)
  process.exit(0)
}

const seed = bip39.generateMnemonic()

const { wallet } = await SparkWallet.initialize({
  mnemonicOrSeed: seed,
  options: {
    network: "MAINNET"
  }
})

const depositAddress = await wallet.getStaticDepositAddress()
const sparkAddress = await wallet.getSparkAddress()

await write_wallet({ seed, depositAddress, sparkAddress })

print_box(
  "WALLET CREATED",
  [
    `SPARK ADDRESS: ${sparkAddress}`,
    `DEPOSIT ADDRESS: ${depositAddress}`,
    `SEED: ${seed}`
  ],
  c.green
)

console.log(`${c.bold}${c.red}STORE THIS SEED SAFELY AND NEVER SHARE IT${c.reset}`)


