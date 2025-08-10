import readline from "readline/promises"
import { SparkWallet } from "@buildonspark/spark-sdk"
import { c, read_wallet, print_box, sleep, fetch_confirmations } from "./utils.js"

const walletData = await read_wallet()
if (!walletData) {
  print_box("NO WALLET FOUND", ["RUN: yarn run create"], c.yellow)
  process.exit(1)
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

print_box(
  "DEPOSIT TO SPARK",
  [
    ` ${walletData.depositAddress || "-"} `
  ],
  c.green
)

print_box(
  "INSTRUCTIONS",
  [
    "SEND BTC TO THE DEPOSIT ADDRESS ABOVE AND PASTE THE TXID BELOW"
  ],
  c.yellow
)

const txId = (await rl.question("TXID: ")).trim()

if (!txId || txId.length < 32) {
  rl.close()
  print_box("INVALID TXID", ["PLEASE PASTE A VALID TRANSACTION ID"], c.red)
  process.exit(1)
}

print_box("AWAITING CONFIRMATIONS", ["NEED 3 CONFIRMATIONS BEFORE CLAIM"], c.yellow)

let confirmations = 0
let spinnerIdx = 0
const asciiFrames = ["-", "\\", "|", "/"]
let spinner

if (process.stdout.isTTY) {
  process.stdout.write("\x1B[?25l")
  spinner = setInterval(() => {
    const frame = asciiFrames[spinnerIdx % asciiFrames.length]
    const text = confirmations === 0 ? "0 CONFIRMATIONS" : `${confirmations} CONFIRMATIONS`
    const line = `${frame} ${text}`
    process.stdout.write(`\x1B[2K\r${line}`)
    spinnerIdx++
  }, 100)
}

while (confirmations < 3) {
  confirmations = await fetch_confirmations(txId)
  if (confirmations >= 3) break
  await sleep(15000)
}

if (spinner) clearInterval(spinner)
if (process.stdout.isTTY) process.stdout.write("\x1B[2K\r✔ " + confirmations + " CONFIRMATIONS\n\x1B[?25h")
else console.log(`✔ ${confirmations} CONFIRMATIONS`)

const { wallet } = await SparkWallet.initialize({
  mnemonicOrSeed: walletData.seed,
  options: { network: "MAINNET" }
})

const quote = await wallet.getClaimStaticDepositQuote(txId)

print_box(
  "DEPOSIT QUOTE",
  [
    `CREDIT AMOUNT (SATS): ${quote.creditAmountSats}`
  ],
  c.green
)

const action = (await rl.question("Press ENTER to claim, or type 'refund' to cancel: ")).trim().toLowerCase()

if (action === "" || action === "claim") {
  const result = await wallet.claimStaticDeposit({
    transactionId: txId,
    creditAmountSats: quote.creditAmountSats,
    sspSignature: quote.signature
  })

  const transferId = result && result.transferId ? result.transferId : String(result)
  const link = `https://www.sparkscan.io/tx/${transferId}?network=mainnet`
  
  print_box("CLAIM SUCCESS", [`TRANSFER ID: ${transferId}`, ``, `${link}`], c.green)
  rl.close()
  process.exit(0)
}

if (action === "refund") {
  const dest = (await rl.question("REFUND DESTINATION ADDRESS: ")).trim()
  const feeStr = (await rl.question("REFUND FEE (>=300 sats): ")).trim()
  const fee = parseInt(feeStr, 10)
  if (!Number.isFinite(fee) || fee < 300) {
    rl.close()
    print_box("INVALID FEE", ["MUST BE >= 300 SATS"], c.red)
    process.exit(1)
  }
  const refundTxHex = await wallet.refundStaticDeposit(txId, dest, fee)
  print_box("REFUND TX HEX", [refundTxHex], c.yellow)
  rl.close()
  process.exit(0)
}

rl.close()
print_box("NO ACTION TAKEN", ["TYPE 'claim' OR 'refund'"], c.yellow)
process.exit(1)


