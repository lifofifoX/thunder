import { c, print_box } from "./utils.js"
import { get_wallet } from "./wallet.js"

const wallet = await get_wallet()

const res = await wallet.getBalance()

const btcLines = []
if (res && typeof res.balance !== "undefined") btcLines.push(`${res.balance.toString()} SATS`)

print_box("BTC", btcLines, c.green)

const tokenLines = []
const tb = res && res.tokenBalances
if (tb) {
  if (typeof tb[Symbol.iterator] === "function") {
    for (const [tokenId, v] of tb) tokenLines.push(`${tokenId}: ${v.balance.toString()}`)
  } else if (typeof tb === "object") {
    for (const key of Object.keys(tb)) tokenLines.push(`${key}: ${tb[key].balance.toString()}`)
  }
}

if (tokenLines.length > 0) print_box("TOKENS", tokenLines, c.yellow)
