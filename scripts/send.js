import { c, print_box, append_transfer_log, create_readline, ask } from "./utils.js"
import { get_wallet } from "./wallet.js"

const wallet = await get_wallet()

print_box("SEND", ["TOKEN IDENTIFIER OR 'SATS'", "AMOUNT", "RECEIVER SPARK ADDRESS"], c.yellow)

const rl = create_readline()

const tokenIdentifier = await ask(rl, "Token identifier (or 'SATS'): ")
const amountInput = await ask(rl, "Amount: ")
const receiverSparkAddress = await ask(rl, "Receiver SPARK address: ")

if (!tokenIdentifier) {
  rl.close()
  print_box("INVALID TOKEN IDENTIFIER", ["REQUIRED"], c.red)
  process.exit(1)
}

if (!amountInput) {
  rl.close()
  print_box("INVALID AMOUNT", ["REQUIRED"], c.red)
  process.exit(1)
}

if (!receiverSparkAddress) {
  rl.close()
  print_box("INVALID RECEIVER", ["RECEIVER REQUIRED"], c.red)
  process.exit(1)
}

if (tokenIdentifier.toLowerCase() === "sats") {
  const amount = Number(amountInput)

  if (!Number.isFinite(amount) || amount <= 0) {
    rl.close()
    print_box("INVALID AMOUNT", ["ENTER A POSITIVE NUMBER"], c.red)
    process.exit(1)
  }

  const transfer = await wallet.transfer({ receiverSparkAddress, amountSats: amount })

  const transferId = transfer && (transfer.id || transfer.transferId) ? (transfer.id || transfer.transferId) : String(transfer)
  const link = `https://www.sparkscan.io/tx/${transferId}?network=mainnet`

  await append_transfer_log({ kind: "btc", receiverSparkAddress, amountSats: amount, transfer })
  print_box("TRANSFER SENT", [`TRANSFER ID: ${transferId}`, "", `${link}`], c.green)
  rl.close()
  process.exit(0)
} else {
  let tokenAmount

  try {
    tokenAmount = BigInt(amountInput)
  } catch {
    rl.close()
    print_box("INVALID AMOUNT", ["ENTER A VALID INTEGER"], c.red)
    process.exit(1)
  }

  const transfer = await wallet.transferTokens({ tokenIdentifier, tokenAmount, receiverSparkAddress })

  const transferId = transfer && (transfer.id || transfer.transferId) ? (transfer.id || transfer.transferId) : String(transfer)
  const link = `https://www.sparkscan.io/tx/${transferId}?network=mainnet`

  await append_transfer_log({ kind: "token", tokenIdentifier, tokenAmount: tokenAmount.toString(), receiverSparkAddress, transfer })
  print_box("TRANSFER SENT", [`TRANSFER ID: ${transferId}`, "", `${link}`], c.green)
  rl.close()
  process.exit(0)
}


