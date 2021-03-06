import { ethAPI } from "../scripts"

export const zeroAddress = "0x0000000000000000000000000000000000000000"
export const defaultToken = { address: zeroAddress, func: zeroAddress, fee: 0, funcName: "Send", tokenName: "ETH", tokenDecimal: "18" }

type ConnectToWallet = { setAddress: any; setMainETHAddress: any; setTxs: any; setIsOpen: any; wallet?: string; network?: string; customEndpoint?: string; }

export const handleConnectToWallet = async ({ setAddress, setMainETHAddress, setTxs, setIsOpen, wallet, network, customEndpoint }: ConnectToWallet) => {
    await ethAPI.connect({ wallet, network, customEndpoint })
    if (!wallet) {
        if (!ethAPI.isConnected()) { return }
    }
    const ethAddress = await ethAPI.getAddress()
    const gaslessAddress = await ethAPI.getGaslessWalletAddress(0)
    setAddress(gaslessAddress)
    setMainETHAddress(ethAddress)
    const txs = await ethAPI.getTransactionCount(gaslessAddress)
    setTxs(txs)
    setIsOpen(false)
}

export const getInitialDetails = async ({ address, setNetwork, setBalance, setSupportedTokensAndFees }) => {
    const network = await ethAPI.getNetwork()
    setNetwork(network)
    const supportedTokensAndFees = await ethAPI.getSupportedTokensAndFee()
    if (supportedTokensAndFees.length > 0) {
        const supportedTokensDetails = await Promise.all(supportedTokensAndFees.map(async stf => {
            const tokenName = await ethAPI.getTokenName(stf.address)
            const tokenDecimal = await ethAPI.getTokenDecimals(stf.address)
            return { ...stf, tokenName, tokenDecimal }
        }))
        supportedTokensDetails.push(defaultToken)
        setSupportedTokensAndFees(supportedTokensDetails)
        const defaultSelected = supportedTokensDetails[0]
        const balance = await ethAPI.getTokenBalance(defaultSelected.address, address)
        setBalance(balance)
    }
}

export const handleSelectedToken = (supportedTokensAndFees = [defaultToken], setSelectedToken) => (e) => {
    const { value } = e.target
    for (const t of supportedTokensAndFees) {
        if (t.address === value) {
            setSelectedToken(t)
            return
        }
    }
}

export const handleSelectedCurrencyChanged = async ({ supportedTokensAndFees, selectedCurrency, address, setBalance, setCurrencyFuncs }) => {
    if (selectedCurrency.address === zeroAddress) { return }
    const newBalance = await ethAPI.getTokenBalance(selectedCurrency.address, address)
    console.log({ newBalance })
    setBalance(newBalance)
    const filter = {}
    const filtered = supportedTokensAndFees.filter(stf => {
        if (selectedCurrency.address === stf.address && !filter[stf.func]) {
            filter[stf.func] = true
            return stf
        }
    })
    setCurrencyFuncs(filtered)
}

export const handleGaslessSend = async (tokenAddress, func, receipientAddress, amount, fee, addressIndex, address, privateKey = "") => {
    const tx = await ethAPI.sendGaslessTokenTx(tokenAddress, func, receipientAddress, amount, fee, addressIndex, address, privateKey = "")
    return tx
}

export const handleGaslessSwap = async (tokenAddress, func, fee, addressIndex, address, calldata, privateKey="") => {
    const tx = await ethAPI.sendGaslessSwapTx(tokenAddress, func, fee, addressIndex, address, calldata, privateKey)
    return tx
}

export const watchBalance = (token, address, setBalance) => async () => {
    const bal = await ethAPI.getTokenBalance(token, address)
    setBalance(bal)
}


export const createWallet = () => {
    
}
export const getUniswapTradeRoute = async (setRoute, setToken0, selectedFunction) => {
    const {route, token0} = await ethAPI.setSwapRouteTrade(selectedFunction)
    setToken0(token0)
    setRoute(route)
}

export const getSwapDetails = async (setSwapDetails, route, token0, amount, to, percent='5', min=20) => {
    const details = await ethAPI.getSwapDetails(route, token0, amount, to, percent, min)
    setSwapDetails(details)
}

export const getOneInchData = async (fromTokenAddress, toTokenAddress, amount, fromAddress, slippage=1) => {
    const baseUrl = "https://api.1inch.exchange/v2.0"
    const spender = "0x111111125434b319222cdbf8c261674adb56f3ae"
    const approveData = (await (await fetch(`${baseUrl}/approve/calldata?amount=${amount}&tokenAddress=${toTokenAddress}`)).json()).data
    const spendData = (await (await fetch(`${baseUrl}/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}`)).json()).data
    return {spender, approveData, spendData}
}

export const gasless1InchSwap = async (fromTokenAddress, _spender, _approveData, spendData) => {
    console.log({fromTokenAddress, _spender, _approveData, spendData})
    return {network:"kovan", txHash: ""}
}
