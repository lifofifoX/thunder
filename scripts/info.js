import { c, read_wallet, print_box } from "./utils.js"

const wallet = await read_wallet()

if (!wallet) {
  print_box("NO WALLET FOUND", ["RUN: yarn run create"], c.yellow)
  process.exit(1)
}

const lines = []
if (wallet.sparkAddress) lines.push(`SPARK ADDRESS: ${wallet.sparkAddress}`)
if (wallet.depositAddress) lines.push(`DEPOSIT ADDRESS: ${wallet.depositAddress}`)
if (wallet.seed) lines.push(`SEED: ${wallet.seed}`)

print_box("SPARK WALLET", lines, c.green)


