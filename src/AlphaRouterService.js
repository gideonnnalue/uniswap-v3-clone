import { AlphaRouter } from "@uniswap/smart-order-router";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { ethers, BigNumber } from "ethers";
import JSBI from "jsbi";
import ERC20ABI from "./abi.json";

const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const INFURA_URL_TESTNET = process.env.REACT_APP_INFURA_URL_TESTNET;

const chainId = 3;

const web3Provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET);
const router = new AlphaRouter({ chainId: chainId, provider: web3Provider });

const name0 = "Wrapped Ether";
const symbol0 = "WETH";
const decimals0 = 18;
const address0 = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

const name1 = "Uniswap Token";
const symbol1 = "UNI";
const decimals1 = 18;
const address1 = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

const WETH = new Token(chainId, address0, decimals0, symbol0, name0);
const UNI = new Token(chainId, address1, decimals1, symbol1, name1);

export const getWethContract = () =>
  new ethers.Contract(address0, ERC20ABI, web3Provider);
export const getUniContract = () =>
  new ethers.Contract(address1, ERC20ABI, web3Provider);

export const getPrice = async (
  inputAmount,
  slippageAmount,
  deadline,
  walletAddress
) => {
  const percentSlippage = new Percent(slippageAmount, 100);
  const wei = ethers.utils.parseUnits(inputAmount.toString(), decimals0);
  const currencyAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(wei));

  const route = await router.route(currencyAmount, UNI, TradeType.EXACT_INPUT, {
    recipient: walletAddress,
    slippageTolerance: percentSlippage,
    deadline: deadline,
  });

  console.log(route, 'route')

  const transaction = {
    data: route.methodParameters.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: BigNumber.from(route.methodParameters.value),
    from: walletAddress,
    gasPrice: BigNumber.from(route.gasPriceWei),
    gasLimit: ethers.utils.hexlify(50000),
  };

  const qouteAmountOut = route.qoute.toFixed(6);
  const ratio = (qouteAmountOut / inputAmount).toFixed(3);

  return [transaction, qouteAmountOut, ratio];
};

export const runSwap = async (transaction, signer) => {
  const approvalAmount = ethers.utils.parseUnits("10", 18).toString();
  const Contract0 = getWethContract();
  await Contract0.connect(signer).approve(
    V3_SWAP_ROUTER_ADDRESS,
    approvalAmount
  );

  signer.sendTransaction(transaction);
};
