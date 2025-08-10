import { c, print_box } from "./utils.js"
import { get_wallet_data } from "./wallet.js"

const wallet = await get_wallet_data()

const lines = []
if (wallet.sparkAddress) lines.push(`SPARK ADDRESS: ${wallet.sparkAddress}`)
if (wallet.depositAddress) lines.push(`DEPOSIT ADDRESS: ${wallet.depositAddress}`)
if (wallet.seed) lines.push(`SEED: ${wallet.seed}`)

if (wallet.sparkAddress) {
  lines.push(``)
  lines.push(`https://www.sparkscan.io/address/${wallet.sparkAddress}?network=mainnet`)
}

print_box("SPARK WALLET", lines, c.green)
