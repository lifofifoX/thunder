import { c, print_box, short_id, format_bigint, format_token_amount } from "./utils.js"
import { get_wallet } from "./wallet.js"

const wallet = await get_wallet()

const res = await wallet.getBalance()

const btcLines = []
if (res && typeof res.balance !== "undefined") btcLines.push(`${format_bigint(res.balance)} SATS`)

print_box("BTC", btcLines, c.green)

const tb = res && res.tokenBalances
if (tb) {
  const showToken = (tokenId, v) => {
    const md = v.tokenInfo?.tokenMetadata || v.tokenMetadata || null
    const name = md?.tokenName || v.tokenInfo?.name || v.name
    const ticker = md?.tokenTicker || v.tokenInfo?.ticker || v.ticker
    const decimals = (md?.decimals ?? v.tokenInfo?.decimals ?? v.decimals ?? 0)
    const title = [name || short_id(tokenId), tokenId]
    const amountStr = format_token_amount(v.balance, decimals)
    const amountLine = ticker ? `${amountStr} $${ticker}` : amountStr
    print_box(title, [amountLine], c.yellow)
  }

  if (typeof tb[Symbol.iterator] === "function") {
    for (const [tokenId, v] of tb) showToken(tokenId, v)
  } else if (typeof tb === "object") {
    for (const key of Object.keys(tb)) showToken(key, tb[key])
  }
}
